import { NextRequest, NextResponse } from "next/server";
import { billingService } from "@/lib/container";
import { currentUser, failure, unauthorized } from "@/infrastructure/http/apiHelpers";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const result = await billingService.sync(id, user.id);
  if (!result.ok) return failure(result);
  return NextResponse.json(result.data);
}
