import { createHmac, timingSafeEqual } from "node:crypto";
import { getMercadoPagoConfig } from "@/infrastructure/config/greenConfig";

const API = "https://api.mercadopago.com";

export interface PixCharge {
  providerPaymentId: string;
  status: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string | null;
  expiresAt: string | null;
}

export interface ProviderPayment {
  id: string;
  status: string;
  externalReference: string | null;
  amount: number;
}

function headers(idempotencyKey?: string): HeadersInit {
  const { accessToken } = getMercadoPagoConfig();
  if (!accessToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
  };
}

export function isMercadoPagoConfigured(): boolean {
  return Boolean(getMercadoPagoConfig().accessToken);
}

export async function createPixCharge(input: {
  externalReference: string;
  amountBrl: number;
  description: string;
  payerEmail: string;
}): Promise<PixCharge> {
  const { publicBaseUrl } = getMercadoPagoConfig();
  const expires = new Date(Date.now() + 30 * 60 * 1000);
  const isPublicUrl = publicBaseUrl.startsWith("https://");
  const response = await fetch(`${API}/v1/payments`, {
    method: "POST",
    headers: headers(`pix-${input.externalReference}`),
    body: JSON.stringify({
      transaction_amount: Number(input.amountBrl.toFixed(2)),
      description: input.description,
      payment_method_id: "pix",
      external_reference: input.externalReference,
      date_of_expiration: expires.toISOString().replace("Z", "-00:00"),
      payer: { email: input.payerEmail },
      ...(isPublicUrl ? { notification_url: `${publicBaseUrl}/api/billing/webhook` } : {}),
    }),
  });
  const data = (await response.json()) as {
    id?: number;
    status?: string;
    message?: string;
    point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string } };
    date_of_expiration?: string;
  };
  if (!response.ok || !data.id) {
    throw new Error(`Mercado Pago recusou a criação do Pix: ${data.message ?? response.status}`);
  }
  const tx = data.point_of_interaction?.transaction_data;
  return {
    providerPaymentId: String(data.id),
    status: data.status ?? "pending",
    qrCode: tx?.qr_code ?? "",
    qrCodeBase64: tx?.qr_code_base64 ?? "",
    ticketUrl: tx?.ticket_url ?? null,
    expiresAt: data.date_of_expiration ?? expires.toISOString(),
  };
}

export async function getProviderPayment(providerPaymentId: string): Promise<ProviderPayment> {
  const response = await fetch(`${API}/v1/payments/${encodeURIComponent(providerPaymentId)}`, {
    headers: headers(),
    cache: "no-store",
  });
  const data = (await response.json()) as {
    id?: number;
    status?: string;
    external_reference?: string;
    transaction_amount?: number;
  };
  if (!response.ok || !data.id) throw new Error(`Falha ao consultar pagamento ${providerPaymentId}`);
  return {
    id: String(data.id),
    status: data.status ?? "unknown",
    externalReference: data.external_reference ?? null,
    amount: data.transaction_amount ?? 0,
  };
}

export async function refundProviderPayment(providerPaymentId: string, amountBrl: number, key: string): Promise<void> {
  const response = await fetch(`${API}/v1/payments/${encodeURIComponent(providerPaymentId)}/refunds`, {
    method: "POST",
    headers: headers(`refund-${key}`),
    body: JSON.stringify({ amount: Number(amountBrl.toFixed(2)) }),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(`Mercado Pago recusou o reembolso: ${data.message ?? response.status}`);
  }
}

export function verifyWebhookSignature(input: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | null;
}): boolean {
  const { webhookSecret } = getMercadoPagoConfig();
  if (!webhookSecret) return true;
  if (!input.signatureHeader || !input.dataId) return false;
  const parts = Object.fromEntries(
    input.signatureHeader.split(",").map((part) => {
      const [k, ...rest] = part.trim().split("=");
      return [k, rest.join("=")];
    })
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;
  const id = /^[a-z0-9]+$/i.test(input.dataId) ? input.dataId.toLowerCase() : input.dataId;
  let manifest = `id:${id};`;
  if (input.requestId) manifest += `request-id:${input.requestId};`;
  manifest += `ts:${ts};`;
  const expected = createHmac("sha256", webhookSecret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function mapProviderStatus(status: string):
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "REFUNDED"
  | "PENDING" {
  switch (status) {
    case "approved":
      return "APPROVED";
    case "rejected":
      return "REJECTED";
    case "cancelled":
      return "CANCELLED";
    case "refunded":
    case "charged_back":
      return "REFUNDED";
    default:
      return "PENDING";
  }
}
