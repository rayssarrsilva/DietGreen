import { prisma } from "@/infrastructure/db/prisma";
import type {
  NewPayment,
  PaymentRecord,
  PaymentRepository,
  PaymentStatusValue,
} from "@/domain/repositories/greenInterfaces";

function num(value: { toString(): string } | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value.toString());
}

type PaymentRow = Awaited<ReturnType<typeof prisma.payment.findUnique>>;

function toRecord(row: NonNullable<PaymentRow>): PaymentRecord {
  return {
    id: row.id,
    userId: row.userId,
    kind: row.kind,
    status: row.status,
    providerPaymentId: row.providerPaymentId,
    amountBrl: num(row.amountBrl),
    feeBrl: num(row.feeBrl),
    marginBrl: num(row.marginBrl),
    chatCreditBrl: num(row.chatCreditBrl),
    attachmentCreditBrl: num(row.attachmentCreditBrl),
    messagesQty: row.messagesQty,
    attachmentsQty: row.attachmentsQty,
    premiumDays: row.premiumDays,
    refundedAmountBrl: num(row.refundedAmountBrl),
    createdAt: row.createdAt,
    approvedAt: row.approvedAt,
    refundedAt: row.refundedAt,
  };
}

export class PrismaPaymentRepository implements PaymentRepository {
  async create(data: NewPayment): Promise<PaymentRecord> {
    const row = await prisma.payment.create({
      data: {
        userId: data.userId,
        kind: data.kind,
        amountBrl: data.amountBrl.toFixed(2),
        feeBrl: data.feeBrl.toFixed(4),
        marginBrl: data.marginBrl.toFixed(4),
        chatCreditBrl: data.chatCreditBrl.toFixed(6),
        attachmentCreditBrl: data.attachmentCreditBrl.toFixed(6),
        messagesQty: data.messagesQty,
        attachmentsQty: data.attachmentsQty,
        premiumDays: data.premiumDays,
        quote: data.quote as object,
      },
    });
    return toRecord(row);
  }

  async findById(id: string): Promise<PaymentRecord | null> {
    const row = await prisma.payment.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async setProviderPaymentId(id: string, providerPaymentId: string): Promise<void> {
    await prisma.payment.update({ where: { id }, data: { providerPaymentId } });
  }

  async markStatus(id: string, status: PaymentStatusValue): Promise<void> {
    await prisma.payment.updateMany({ where: { id, status: "PENDING" }, data: { status } });
  }

  async applyApproved(id: string, now: Date): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const claimed = await tx.payment.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "APPROVED", approvedAt: now },
      });
      if (claimed.count !== 1) return false;
      const payment = await tx.payment.findUniqueOrThrow({ where: { id } });
      if (!payment.userId) return true;
      const account = await tx.greenAccount.upsert({
        where: { userId: payment.userId },
        create: { userId: payment.userId },
        update: {},
      });
      if (payment.kind === "PREMIUM") {
        const base = account.premiumUntil && account.premiumUntil > now ? account.premiumUntil : now;
        await tx.greenAccount.update({
          where: { userId: payment.userId },
          data: {
            premiumUntil: new Date(base.getTime() + payment.premiumDays * 24 * 60 * 60 * 1000),
            trialClosed: true,
          },
        });
      } else {
        const chat = num(account.chatBalanceBrl) + num(payment.chatCreditBrl);
        const attachment = num(account.attachmentBalanceBrl) + num(payment.attachmentCreditBrl);
        await tx.greenAccount.update({
          where: { userId: payment.userId },
          data: {
            chatBalanceBrl: chat.toFixed(6),
            attachmentBalanceBrl: attachment.toFixed(6),
            chatCapacityBrl: Math.max(chat, 0).toFixed(6),
            attachmentCapacityBrl: Math.max(attachment, 0).toFixed(6),
            trialClosed: true,
          },
        });
      }
      return true;
    });
  }

  async listByUser(userId: string): Promise<PaymentRecord[]> {
    const rows = await prisma.payment.findMany({
      where: { userId, status: { not: "PENDING" } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return rows.map(toRecord);
  }

  async applyRefund(
    id: string,
    refundBrl: number,
    creditsToRemove: { chat: number; attachment: number },
    endPremium: boolean,
    now: Date
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUniqueOrThrow({ where: { id } });
      const fullRefund = refundBrl >= num(payment.amountBrl) - 0.005;
      await tx.payment.update({
        where: { id },
        data: {
          status: fullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
          refundedAmountBrl: refundBrl.toFixed(2),
          refundedAt: now,
        },
      });
      if (!payment.userId) return;
      await tx.greenAccount.update({
        where: { userId: payment.userId },
        data: {
          chatBalanceBrl: { decrement: creditsToRemove.chat.toFixed(6) },
          attachmentBalanceBrl: { decrement: creditsToRemove.attachment.toFixed(6) },
          ...(endPremium ? { premiumUntil: now } : {}),
        },
      });
    });
  }

  async hasApprovedCreditsAfter(userId: string, date: Date): Promise<boolean> {
    const count = await prisma.payment.count({
      where: { userId, kind: "CREDITS", status: { in: ["APPROVED", "PARTIALLY_REFUNDED"] }, approvedAt: { gte: date } },
    });
    return count > 0;
  }
}
