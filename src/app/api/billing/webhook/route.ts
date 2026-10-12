import { NextRequest, NextResponse } from "next/server";
import { billingService } from "@/lib/container";
import { verifyWebhookSignature } from "@/infrastructure/payments/mercadoPagoClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { type?: string; data?: { id?: string | number } };
  const url = new URL(req.url);
  const dataId = url.searchParams.get("data.id") ?? (body.data?.id !== undefined ? String(body.data.id) : null);
  const type = url.searchParams.get("type") ?? body.type;

  const valid = verifyWebhookSignature({
    signatureHeader: req.headers.get("x-signature"),
    requestId: req.headers.get("x-request-id"),
    dataId,
  });
  if (!valid) return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  if (type !== "payment" || !dataId) return NextResponse.json({ ok: true });

  try {
    await billingService.handleWebhook(dataId);
  } catch (err) {
    console.error("webhook processing failed", err);
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
