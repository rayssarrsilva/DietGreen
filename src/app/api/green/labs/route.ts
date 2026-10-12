import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { greenService } from "@/lib/container";
import { badRequest, currentUser, failure, unauthorized } from "@/infrastructure/http/apiHelpers";

export const dynamic = "force-dynamic";

const valueSchema = z.object({
  marker: z.string().trim().min(1).max(120),
  value: z.number().finite(),
  unit: z.string().trim().max(40),
  labRangeLow: z.number().finite().nullable(),
  labRangeHigh: z.number().finite().nullable(),
  labRangeText: z.string().max(200).nullable(),
});

const saveSchema = z.object({
  collectedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  labName: z.string().max(120).nullable(),
  values: z.array(valueSchema).min(1).max(120),
});

const classifySchema = z.object({ values: z.array(valueSchema).min(1).max(120), classifyOnly: z.literal(true) });

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  return NextResponse.json({ reports: await greenService.listLabs(user.id) });
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const json = await req.json().catch(() => null);
  const classifyOnly = classifySchema.safeParse(json);
  if (classifyOnly.success) return NextResponse.json({ values: greenService.classify(classifyOnly.data.values) });
  const parsed = saveSchema.safeParse(json);
  if (!parsed.success) return badRequest(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  const result = await greenService.saveLabs(user.id, parsed.data);
  if (!result.ok) return failure(result);
  return NextResponse.json(result.data);
}

export async function DELETE() {
  const user = await currentUser();
  if (!user) return unauthorized();
  await greenService.deleteAllLabs(user.id);
  return NextResponse.json({ ok: true });
}
