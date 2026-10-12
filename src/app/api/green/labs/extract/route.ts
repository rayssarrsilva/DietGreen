import { NextRequest, NextResponse } from "next/server";
import { greenService } from "@/lib/container";
import { badRequest, currentUser, failure, unauthorized } from "@/infrastructure/http/apiHelpers";
import { logAccess } from "@/infrastructure/http/requestGuards";
import { SUPPORTED_ATTACHMENT_TYPES, type AttachmentType } from "@/infrastructure/ai/labExtractor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return badRequest("file is required");
  if (!SUPPORTED_ATTACHMENT_TYPES.includes(file.type as AttachmentType)) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 415 });
  }
  logAccess(req, user.id, "green.labs.extract");
  const bytes = Buffer.from(await file.arrayBuffer());
  const result = await greenService.extractLabs(user.id, { bytes, mediaType: file.type as AttachmentType });
  bytes.fill(0);
  if (!result.ok) return failure(result);
  return NextResponse.json(result.data);
}
