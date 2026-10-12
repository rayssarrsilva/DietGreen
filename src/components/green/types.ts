import type { ClassifiedLabValue } from "@/domain/entities/green";

export interface GreenSettingsView {
  greenStyle: "direct" | "technical" | "detailed" | "custom";
  greenCustomStyle: string | null;
  adultConfirmed: boolean;
  chatTermsAccepted: boolean;
  healthProcessingConsent: boolean;
  healthStorageConsent: boolean;
}

export interface ChatItem {
  role: "user" | "assistant";
  content: string;
}

export interface LabDraft {
  collectedAt: string | null;
  labName: string | null;
  values: ClassifiedLabValue[];
}

export interface Paywall {
  code: string;
  retryAt?: string;
  canRefill?: boolean;
}

export async function saveSettings(patch: Partial<GreenSettingsView>): Promise<GreenSettingsView | null> {
  const response = await fetch("/api/green/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return response.ok ? ((await response.json()) as GreenSettingsView) : null;
}
