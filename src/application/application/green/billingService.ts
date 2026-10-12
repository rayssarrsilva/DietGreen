import type { GreenRepository, PaymentRecord, PaymentRepository } from "@/domain/repositories/greenInterfaces";
import { isPremiumActive } from "@/domain/services/chatAccess";
import { quoteCredits, quotePricePoint } from "@/domain/services/pricing";
import { findPreset } from "@/domain/services/creditPresets";
import type { PricingService } from "@/application/green/pricingService";
import type { ServiceResult } from "@/application/green/greenService";
import type { GreenConfig } from "@/infrastructure/config/greenConfig";
import {
  createPixCharge,
  getProviderPayment,
  isMercadoPagoConfigured,
  mapProviderStatus,
  refundProviderPayment,
} from "@/infrastructure/payments/mercadoPagoClient";

export type CheckoutRequest =
  | { kind: "premium" }
  | { kind: "credits"; presetId: string }
  | { kind: "credits"; messages: number; attachments: number };

export interface CheckoutResult {
  paymentId: string;
  amountBrl: number;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string | null;
  expiresAt: string | null;
}

export interface PaymentView {
  id: string;
  kind: "PREMIUM" | "CREDITS";
  status: string;
  amountBrl: number;
  messagesQty: number;
  attachmentsQty: number;
  premiumDays: number;
  refundedAmountBrl: number;
  createdAt: string;
  approvedAt: string | null;
  refundableUntil: string | null;
}

export class BillingService {
  constructor(
    private readonly repo: GreenRepository,
    private readonly payments: PaymentRepository,
    private readonly pricing: PricingService,
    private readonly config: GreenConfig
  ) {}

  toView(p: PaymentRecord): PaymentView {
    const until = p.approvedAt ? new Date(p.approvedAt.getTime() + this.config.refundWindowDays * 86_400_000) : null;
    return {
      id: p.id,
      kind: p.kind,
      status: p.status,
      amountBrl: p.amountBrl,
      messagesQty: p.messagesQty,
      attachmentsQty: p.attachmentsQty,
      premiumDays: p.premiumDays,
      refundedAmountBrl: p.refundedAmountBrl,
      createdAt: p.createdAt.toISOString(),
      approvedAt: p.approvedAt?.toISOString() ?? null,
      refundableUntil: p.status === "APPROVED" && until && until > new Date() ? until.toISOString() : null,
    };
  }

  async checkout(user: { id: string; email: string | null }, request: CheckoutRequest): Promise<ServiceResult<CheckoutResult>> {
    if (!isMercadoPagoConfigured()) return { ok: false, status: 503, code: "payments_unavailable" };
    if (!user.email) return { ok: false, status: 400, code: "email_required" };
    const settings = await this.repo.getSettings(user.id);
    if (!settings.adultConfirmedAt || !settings.chatTermsAcceptedAt) {
      return { ok: false, status: 403, code: "consent_required" };
    }
    const snapshot = await this.pricing.snapshot();
    const account = await this.repo.getOrCreateAccount(user.id);

    let payment: PaymentRecord;
    let description: string;
    if (request.kind === "premium") {
      const q = snapshot.premium;
      payment = await this.payments.create({
        userId: user.id,
        kind: "PREMIUM",
        amountBrl: q.totalBrl,
        feeBrl: q.feeBrl,
        marginBrl: q.marginBrl,
        chatCreditBrl: 0,
        attachmentCreditBrl: 0,
        messagesQty: 0,
        attachmentsQty: 0,
        premiumDays: q.days,
        quote: { ...q, usdBrl: snapshot.usdBrl, model: snapshot.model },
      });
      description = `DietGreen Premium ${q.days} dias`;
    } else {
      if (!isPremiumActive(account, new Date())) return { ok: false, status: 403, code: "premium_required" };
      let q;
      if ("presetId" in request) {
        const preset = findPreset(request.presetId);
        q = preset ? quotePricePoint(preset, snapshot.params) : null;
        if (!q) return { ok: false, status: 400, code: "invalid_preset" };
      } else {
        q = quoteCredits(request.messages, request.attachments, snapshot.params);
      }
      if (q.totalBrl <= 0) return { ok: false, status: 400, code: "empty_quote" };
      payment = await this.payments.create({
        userId: user.id,
        kind: "CREDITS",
        amountBrl: q.totalBrl,
        feeBrl: q.feeBrl,
        marginBrl: q.marginBrl,
        chatCreditBrl: q.chatCreditBrl,
        attachmentCreditBrl: q.attachmentCreditBrl,
        messagesQty: q.messages,
        attachmentsQty: q.attachments,
        premiumDays: 0,
        quote: { ...q, params: snapshot.params, usdBrl: snapshot.usdBrl, model: snapshot.model },
      });
      description = `DietGreen créditos: ${q.messages} mensagens + ${q.attachments} anexos`;
    }

    try {
      const charge = await createPixCharge({
        externalReference: payment.id,
        amountBrl: payment.amountBrl,
        description,
        payerEmail: user.email,
      });
      await this.payments.setProviderPaymentId(payment.id, charge.providerPaymentId);
      return {
        ok: true,
        data: {
          paymentId: payment.id,
          amountBrl: payment.amountBrl,
          qrCode: charge.qrCode,
          qrCodeBase64: charge.qrCodeBase64,
          ticketUrl: charge.ticketUrl,
          expiresAt: charge.expiresAt,
        },
      };
    } catch (err) {
      console.error("pix creation failed", err);
      await this.payments.markStatus(payment.id, "CANCELLED");
      return { ok: false, status: 502, code: "pix_failed" };
    }
  }

  async sync(paymentId: string, userId: string | null): Promise<ServiceResult<PaymentView>> {
    const payment = await this.payments.findById(paymentId);
    if (!payment || (userId && payment.userId !== userId)) return { ok: false, status: 404, code: "not_found" };
    if (payment.status === "PENDING" && payment.providerPaymentId) {
      await this.applyProviderState(payment);
    }
    const fresh = await this.payments.findById(paymentId);
    return { ok: true, data: this.toView(fresh ?? payment) };
  }

  async handleWebhook(providerPaymentId: string): Promise<void> {
    const provider = await getProviderPayment(providerPaymentId);
    if (!provider.externalReference) return;
    const payment = await this.payments.findById(provider.externalReference);
    if (!payment || payment.providerPaymentId !== provider.id) return;
    await this.applyProviderState(payment, provider);
  }

  private async applyProviderState(
    payment: PaymentRecord,
    known?: Awaited<ReturnType<typeof getProviderPayment>>
  ): Promise<void> {
    if (!payment.providerPaymentId) return;
    const provider = known ?? (await getProviderPayment(payment.providerPaymentId));
    const status = mapProviderStatus(provider.status);
    if (status === "APPROVED") {
      if (Math.abs(provider.amount - payment.amountBrl) > 0.009) {
        console.error("payment amount mismatch", payment.id, provider.amount, payment.amountBrl);
        return;
      }
      await this.payments.applyApproved(payment.id, new Date());
    } else if (status === "REJECTED" || status === "CANCELLED") {
      await this.payments.markStatus(payment.id, status);
    }
  }

  async list(userId: string): Promise<PaymentView[]> {
    const rows = await this.payments.listByUser(userId);
    return rows.map((p) => this.toView(p));
  }

  async refund(userId: string, paymentId: string): Promise<ServiceResult<{ refundBrl: number }>> {
    const payment = await this.payments.findById(paymentId);
    if (!payment || payment.userId !== userId) return { ok: false, status: 404, code: "not_found" };
    if (payment.status !== "APPROVED" || !payment.approvedAt || !payment.providerPaymentId) {
      return { ok: false, status: 400, code: "not_refundable" };
    }
    const now = new Date();
    if (now.getTime() - payment.approvedAt.getTime() > this.config.refundWindowDays * 86_400_000) {
      return { ok: false, status: 400, code: "refund_window_closed" };
    }

    let refundBrl = 0;
    let creditsToRemove = { chat: 0, attachment: 0 };
    let endPremium = false;
    if (payment.kind === "PREMIUM") {
      refundBrl = payment.amountBrl;
      endPremium = true;
    } else {
      const account = await this.repo.getOrCreateAccount(userId);
      const unusedChat = Math.max(0, Math.min(payment.chatCreditBrl, account.chatBalanceBrl));
      const unusedAttachment = Math.max(0, Math.min(payment.attachmentCreditBrl, account.attachmentBalanceBrl));
      const credited = payment.chatCreditBrl + payment.attachmentCreditBrl;
      const fraction = credited > 0 ? (unusedChat + unusedAttachment) / credited : 0;
      refundBrl = Math.floor(payment.amountBrl * fraction * 100 + 1e-7) / 100;
      creditsToRemove = { chat: unusedChat, attachment: unusedAttachment };
    }
    if (refundBrl < 0.01) return { ok: false, status: 400, code: "nothing_to_refund" };

    try {
      await refundProviderPayment(payment.providerPaymentId, refundBrl, payment.id);
    } catch (err) {
      console.error("refund failed", err);
      return { ok: false, status: 502, code: "refund_failed" };
    }
    await this.payments.applyRefund(payment.id, refundBrl, creditsToRemove, endPremium, now);
    return { ok: true, data: { refundBrl } };
  }
}
