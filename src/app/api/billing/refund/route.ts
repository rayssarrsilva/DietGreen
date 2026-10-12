import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { billingService } from "@/lib/container";
import { badRequest, currentUser, failure, unauthorized } from "@/infrastructure/http/apiHelpers";
import { logAccess } from "@/infrastructure/http/requestGuards";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const parsed = z.object({ paymentId: z.string().min(1) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("paymentId is required");
  logAccess(req, user.id, "billing.refund");
  const result = await billingService.refund(user.id, parsed.data.paymentId);
  if (!result.ok) return failure(result);
  return NextResponse.json(result.data);
}
