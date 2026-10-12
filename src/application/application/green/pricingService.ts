import type { GreenRepository } from "@/domain/repositories/greenInterfaces";
import { quotePremium, type PremiumQuote, type PricingParams } from "@/domain/services/pricing";
import { estimateDefaultCostsBrl } from "@/domain/services/costEstimates";
import { CREDIT_PRESETS, CUSTOM_LIMITS, type CreditPreset } from "@/domain/services/creditPresets";
import type { GreenConfig } from "@/infrastructure/config/greenConfig";
import { getUsdBrlRate } from "@/infrastructure/fx/exchangeRateService";

export interface PricingSnapshot {
  params: PricingParams;
  premium: PremiumQuote;
  usdBrl: number;
  cardMarkup: number;
  model: string;
  measured: { messages: number; attachments: number };
  presets: CreditPreset[];
  customLimits: typeof CUSTOM_LIMITS;
  trialLimit: number;
  refundWindowDays: number;
  updatedAt: string;
}

const CACHE_MS = 10 * 60 * 1000;

export class PricingService {
  private cache: { at: number; value: PricingSnapshot } | null = null;

  constructor(private readonly repo: GreenRepository, private readonly config: GreenConfig) {}

  async snapshot(): Promise<PricingSnapshot> {
    if (this.cache && Date.now() - this.cache.at < CACHE_MS) return this.cache.value;
    const usdBrl = await getUsdBrlRate(this.config.usdBrlFallback);
    const defaults = estimateDefaultCostsBrl(this.config.price, usdBrl, this.config.cardMarkup);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let messageStats = { average: 0, count: 0 };
    let attachmentStats = { average: 0, count: 0 };
    try {
      [messageStats, attachmentStats] = await Promise.all([
        this.repo.averageCostBrl(["CHAT", "TRIAL"], since),
        this.repo.averageCostBrl(["ATTACHMENT"], since),
      ]);
    } catch (err) {
      console.error("usage averages unavailable", err);
    }
    const enough = this.config.minSamplesForAverage;
    const params: PricingParams = {
      avgMessageBrl: messageStats.count >= enough ? messageStats.average : defaults.message,
      avgAttachmentBrl: attachmentStats.count >= enough ? attachmentStats.average : defaults.attachment,
      feeRate: this.config.feeRate,
      marginRate: this.config.marginRate,
      minPaymentBrl: this.config.minPaymentBrl,
    };
    const value: PricingSnapshot = {
      params,
      premium: quotePremium(params, this.config.trialLimit, this.config.premiumDays, this.config.premiumPriceBrl),
      usdBrl,
      cardMarkup: this.config.cardMarkup,
      model: this.config.model,
      measured: { messages: messageStats.count, attachments: attachmentStats.count },
      presets: CREDIT_PRESETS,
      customLimits: CUSTOM_LIMITS,
      trialLimit: this.config.trialLimit,
      refundWindowDays: this.config.refundWindowDays,
      updatedAt: new Date().toISOString(),
    };
    this.cache = { at: Date.now(), value };
    return value;
  }
}
