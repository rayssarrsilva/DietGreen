import { NextResponse } from "next/server";
import { auth } from "@/infrastructure/auth/auth";

export interface SessionUser {
  id: string;
  email: string | null;
}

export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, email: session.user.email ?? null };
}

export function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export function failure(result: { status: number; code: string; details?: Record<string, unknown> }) {
  return NextResponse.json({ error: result.code, ...(result.details ?? {}) }, { status: result.status });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: "invalid_request", message }, { status: 400 });
}
