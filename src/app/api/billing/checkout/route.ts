import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { billingService } from "@/lib/container";
import { badRequest, currentUser, failure, unauthorized } from "@/infrastructure/http/apiHelpers";
import { logAccess } from "@/infrastructure/http/requestGuards";

export const dynamic = "force-dynamic";

const schema = z.union([
  z.object({ kind: z.literal("premium") }),
  z.object({ kind: z.literal("credits"), presetId: z.string().min(1).max(20) }),
  z.object({
    kind: z.literal("credits"),
    messages: z.number().int().min(0).max(2000),
    attachments: z.number().int().min(0).max(100),
  }),
]);

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("invalid checkout request");
  logAccess(req, user.id, "billing.checkout");
  const result = await billingService.checkout(user, parsed.data);
  if (!result.ok) return failure(result);
  return NextResponse.json(result.data);
}
