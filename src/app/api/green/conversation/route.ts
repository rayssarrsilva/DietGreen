import { NextResponse } from "next/server";
import { greenService } from "@/lib/container";
import { currentUser, unauthorized } from "@/infrastructure/http/apiHelpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  const turns = await greenService.conversation(user.id);
  return NextResponse.json({
    messages: turns.map((t) => ({ role: t.role, content: t.content, createdAt: t.createdAt?.toISOString() ?? null })),
  });
}

export async function DELETE() {
  const user = await currentUser();
  if (!user) return unauthorized();
  await greenService.clearConversation(user.id);
  return NextResponse.json({ ok: true });
}
