export type GreenStyle = "direct" | "technical" | "detailed" | "custom";

export const GREEN_STYLES: GreenStyle[] = ["direct", "technical", "detailed", "custom"];

export type ChatRole = "user" | "assistant";

export interface ChatTurn {
  role: ChatRole;
  content: string;
  createdAt?: Date;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
}

export interface ModelPrice {
  inputPerMTok: number;
  outputPerMTok: number;
  cacheWritePerMTok: number;
  cacheReadPerMTok: number;
}

export interface GreenAccountState {
  chatBalanceBrl: number;
  attachmentBalanceBrl: number;
  chatCapacityBrl: number;
  attachmentCapacityBrl: number;
  premiumUntil: Date | null;
  trialMessagesUsed: number;
  trialLastMessageAt: Date | null;
  trialClosed: boolean;
}

export interface GreenSettingsState {
  greenStyle: GreenStyle;
  greenCustomStyle: string | null;
  adultConfirmedAt: Date | null;
  chatTermsAcceptedAt: Date | null;
  healthProcessingConsentAt: Date | null;
  healthStorageConsentAt: Date | null;
}

export type LabStatus = "low" | "normal" | "high" | "unknown";

export interface ExtractedLabValue {
  marker: string;
  value: number;
  unit: string;
  labRangeLow: number | null;
  labRangeHigh: number | null;
  labRangeText: string | null;
}

export interface ClassifiedLabValue extends ExtractedLabValue {
  markerKey: string | null;
  labStatus: LabStatus;
  guidelineStatus: LabStatus;
  guidelineLabel: string | null;
  guidelineSource: string | null;
  critical: boolean;
}

export interface LabReport {
  id?: string;
  collectedAt: string | null;
  labName: string | null;
  values: ClassifiedLabValue[];
  savedAt?: string;
}
