import { NextRequest, NextResponse } from "next/server";
import { accountDataService } from "@/lib/container";
import { currentUser, unauthorized } from "@/infrastructure/http/apiHelpers";
import { logAccess } from "@/infrastructure/http/requestGuards";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();
  logAccess(req, user.id, "me.export");
  const data = await accountDataService.export(user.id);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="dietgreen-meus-dados-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
