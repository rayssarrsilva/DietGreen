import { NextRequest } from "next/server";
import { z } from "zod";
import { greenService } from "@/lib/container";
import { badRequest, currentUser, failure, unauthorized } from "@/infrastructure/http/apiHelpers";
import { logAccess } from "@/infrastructure/http/requestGuards";
import type { GreenStreamEvent } from "@/domain/entities/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ message: z.string().trim().min(1).max(2000) });

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("message must have 1 to 2000 characters");
  logAccess(req, user.id, "green.chat");

  const gate = await greenService.authorizeChat(user.id);
  if (!gate.ok) return failure(gate);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: GreenStreamEvent) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          return;
        }
      };
      await greenService.runChat(gate.data, parsed.data.message, emit, req.signal);
      try {
        controller.close();
      } catch {
        return;
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
