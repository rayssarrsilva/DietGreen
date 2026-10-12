import { describe, expect, it } from "vitest";
import { approximateUnits, charmPrice, costUsd, quoteCredits, quotePremium, quotePricePoint, type PricingParams } from "./pricing";
import { CREDIT_PRESETS } from "./creditPresets";

const params: PricingParams = { avgMessageBrl: 0.06, avgAttachmentBrl: 0.1, feeRate: 0.0099, marginRate: 0.4, minPaymentBrl: 1 };

describe("pricing", () => {
  it("computes token cost", () => {
    expect(costUsd({ inputTokens: 1_000_000, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 }, { inputPerMTok: 1, outputPerMTok: 5, cacheReadPerMTok: 0.1, cacheWritePerMTok: 1.25 })).toBe(1);
  });

  it("applies 40% over ai cost plus fee", () => {
    const q = quoteCredits(600, 0, params);
    expect(q.aiCostBrl).toBeCloseTo(36, 6);
    expect(q.marginBrl).toBeGreaterThanOrEqual(0.4 * (q.aiCostBrl + q.feeBrl) - 0.01);
    expect(q.feeBrl).toBeCloseTo(q.totalBrl * 0.0099, 4);
    expect(q.totalBrl).toBe(51.99);
  });

  it("applies minimum payment", () => {
    const q = quoteCredits(10, 0, params);
    expect(q.totalBrl).toBe(1.49);
    expect(q.minimumApplied).toBe(true);
  });

  it("returns zero quote for empty selection", () => {
    expect(quoteCredits(0, 0, params).totalBrl).toBe(0);
  });

  it("uses the premium base price unless costs exceed it", () => {
    expect(quotePremium(params, 5, 30, 7.99).totalBrl).toBe(7.99);
    const expensive = quotePremium({ ...params, avgMessageBrl: 2 }, 5, 30, 7.99);
    expect(expensive.totalBrl).toBe(10.49);
    expect(expensive.minimumApplied).toBe(true);
  });

  it("rounds to charm prices", () => {
    expect(charmPrice(0.86)).toBe(0.99);
    expect(charmPrice(4.2)).toBe(4.49);
    expect(charmPrice(4.5)).toBe(4.99);
    expect(charmPrice(23.1)).toBe(23.99);
    expect(charmPrice(103)).toBe(109.9);
    expect(charmPrice(109.9)).toBe(109.9);
    expect(charmPrice(110)).toBe(119.9);
  });

  it("fills price-point packs keeping at least 40% margin", () => {
    for (const preset of CREDIT_PRESETS) {
      const q = quotePricePoint(preset, params);
      expect(q).not.toBeNull();
      expect(q!.totalBrl).toBe(preset.priceBrl);
      expect(q!.marginBrl).toBeGreaterThanOrEqual(0.4 * (q!.aiCostBrl + q!.feeBrl) - 1e-6);
      if (preset.group === "combo") expect(q!.attachments).toBeGreaterThanOrEqual(1);
    }
    expect(quotePricePoint(CREDIT_PRESETS[2], params)!.messages).toBe(117);
  });

  it("approximates units", () => {
    expect(approximateUnits(0.3, 0.06)).toBe(5);
    expect(approximateUnits(-1, 0.06)).toBe(0);
  });
});
