import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { greenService } from "@/lib/container";
import { badRequest, currentUser, unauthorized } from "@/infrastructure/http/apiHelpers";
import { GREEN_STYLES, type GreenSettingsState, type GreenStyle } from "@/domain/entities/green";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  greenStyle: z.enum(GREEN_STYLES as [GreenStyle, ...GreenStyle[]]).optional(),
  greenCustomStyle: z.string().max(500).nullable().optional(),
  adultConfirmed: z.boolean().optional(),
  chatTermsAccepted: z.boolean().optional(),
  healthProcessingConsent: z.boolean().optional(),
  healthStorageConsent: z.boolean().optional(),
});

function view(s: GreenSettingsState) {
  return {
    greenStyle: s.greenStyle,
    greenCustomStyle: s.greenCustomStyle,
    adultConfirmed: Boolean(s.adultConfirmedAt),
    chatTermsAccepted: Boolean(s.chatTermsAcceptedAt),
    healthProcessingConsent: Boolean(s.healthProcessingConsentAt),
    healthStorageConsent: Boolean(s.healthStorageConsentAt),
  };
}

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  return NextResponse.json(view(await greenService.settings(user.id)));
}

export async function PUT(req: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("invalid settings");
  return NextResponse.json(view(await greenService.updateSettings(user.id, parsed.data)));
}
