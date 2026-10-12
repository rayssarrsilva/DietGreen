import { NextResponse } from "next/server";
import { pricingService } from "@/lib/container";
import { getSellerInfo } from "@/infrastructure/config/greenConfig";
import { isMercadoPagoConfigured } from "@/infrastructure/payments/mercadoPagoClient";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await pricingService.snapshot();
  return NextResponse.json({ ...snapshot, paymentsEnabled: isMercadoPagoConfigured(), seller: getSellerInfo() });
}
