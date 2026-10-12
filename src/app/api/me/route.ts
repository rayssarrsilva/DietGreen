import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { accountDataService } from "@/lib/container";
import { badRequest, currentUser, unauthorized } from "@/infrastructure/http/apiHelpers";
import { logAccess } from "@/infrastructure/http/requestGuards";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const parsed = z.object({ confirm: z.literal("DELETE") }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("confirmation required");
  logAccess(req, null, "me.delete");
  await accountDataService.deleteAccount(user.id);
  return NextResponse.json({ ok: true });
}
