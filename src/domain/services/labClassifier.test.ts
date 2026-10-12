import { describe, expect, it } from "vitest";
import { classifyLabValue, findMarker } from "./labClassifier";
import { LAB_MARKERS } from "@/infrastructure/knowledge/labMarkers";

const v = (marker: string, value: number, unit: string, low: number | null = null, high: number | null = null) => ({ marker, value, unit, labRangeLow: low, labRangeHigh: high, labRangeText: null });

describe("lab classifier", () => {
  it("matches specific markers before generic ones", () => {
    expect(findMarker("Hemoglobina glicada", LAB_MARKERS)?.key).toBe("hba1c");
    expect(findMarker("Hemoglobina", LAB_MARKERS)?.key).toBe("hemoglobin");
    expect(findMarker("Colesterol não-HDL", LAB_MARKERS)?.key).toBe("non_hdl");
    expect(findMarker("VLDL colesterol", LAB_MARKERS)?.key).toBe("vldl");
    expect(findMarker("Ferritina", LAB_MARKERS)?.key).toBe("ferritin");
  });
  it("uses lab range and guideline separately", () => {
    const r = classifyLabValue(v("25-OH Vitamina D", 25, "ng/mL", 30, 100), LAB_MARKERS);
    expect(r.labStatus).toBe("low");
    expect(r.guidelineStatus).toBe("normal");
  });
  it("converts units", () => {
    const r = classifyLabValue(v("Glicose", 7, "mmol/L"), LAB_MARKERS);
    expect(r.guidelineStatus).toBe("high");
  });
  it("flags critical values", () => {
    expect(classifyLabValue(v("Potássio", 6.8, "mEq/L", 3.5, 5.1), LAB_MARKERS).critical).toBe(true);
  });
});
