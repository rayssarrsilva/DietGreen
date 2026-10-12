import type {
  ClassifiedLabValue,
  ExtractedLabValue,
  LabStatus,
} from "@/domain/entities/green";

export interface LabThresholds {
  low?: number;
  high?: number;
}

export interface LabMarkerReference {
  key: string;
  label: string;
  aliases: string[];
  unit: string;
  conversions: Record<string, number>;
  guideline: (LabThresholds & { label: string; source: string }) | null;
  critical: LabThresholds | null;
  notes: string;
  foodFocusLow: string | null;
  foodFocusHigh: string | null;
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function normalizeUnit(unit: string): string {
  return normalizeText(unit)
    .replace(/[µμ]/g, "u")
    .replace(/mcg/g, "ug")
    .replace(/\s+/g, "")
    .replace(/meq/g, "mmol")
    .replace(/uui\/ml/g, "mui/l");
}

function tokens(value: string): string[] {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function compact(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "");
}

export function findMarker(
  name: string,
  references: LabMarkerReference[]
): LabMarkerReference | null {
  const nameCompact = compact(name);
  const nameTokens = new Set(tokens(name));
  const candidates = references
    .flatMap((ref) => ref.aliases.map((alias) => ({ ref, alias: compact(alias) })))
    .sort((a, b) => b.alias.length - a.alias.length);
  for (const { ref, alias } of candidates) {
    if (alias.length <= 4) {
      if (nameTokens.has(alias) || nameCompact === alias) return ref;
    } else if (nameCompact.includes(alias)) {
      return ref;
    }
  }
  return null;
}

export function toCanonical(
  value: number,
  unit: string,
  ref: LabMarkerReference
): number | null {
  const normalized = normalizeUnit(unit);
  if (normalized === normalizeUnit(ref.unit)) return value;
  const factor = ref.conversions[normalized];
  return factor === undefined ? null : value * factor;
}

function compare(value: number, thresholds: LabThresholds): LabStatus {
  if (thresholds.low !== undefined && value < thresholds.low) return "low";
  if (thresholds.high !== undefined && value > thresholds.high) return "high";
  return "normal";
}

export function classifyLabValue(
  input: ExtractedLabValue,
  references: LabMarkerReference[]
): ClassifiedLabValue {
  const ref = findMarker(input.marker, references);

  let labStatus: LabStatus = "unknown";
  if (input.labRangeLow !== null || input.labRangeHigh !== null) {
    labStatus = compare(input.value, {
      low: input.labRangeLow ?? undefined,
      high: input.labRangeHigh ?? undefined,
    });
  }

  let guidelineStatus: LabStatus = "unknown";
  let critical = false;
  if (ref) {
    const canonical = toCanonical(input.value, input.unit, ref);
    if (canonical !== null) {
      if (ref.guideline) guidelineStatus = compare(canonical, ref.guideline);
      if (ref.critical) critical = compare(canonical, ref.critical) !== "normal";
    }
  }

  return {
    ...input,
    markerKey: ref?.key ?? null,
    labStatus,
    guidelineStatus,
    guidelineLabel: ref?.guideline?.label ?? null,
    guidelineSource: ref?.guideline?.source ?? null,
    critical,
  };
}
