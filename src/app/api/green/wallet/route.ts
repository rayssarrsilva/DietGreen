import { NextResponse } from "next/server";
import { greenService } from "@/lib/container";
import { currentUser, unauthorized } from "@/infrastructure/http/apiHelpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  return NextResponse.json(await greenService.wallet(user.id));
}
