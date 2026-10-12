import { NextRequest, NextResponse } from "next/server";
import { greenService } from "@/lib/container";
import { currentUser, unauthorized } from "@/infrastructure/http/apiHelpers";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  await greenService.deleteLab(user.id, id);
  return NextResponse.json({ ok: true });
}
