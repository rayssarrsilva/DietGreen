import type { ModelPrice } from "@/domain/entities/green";

function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const MODEL_PRICES: Record<string, ModelPrice> = {
  "claude-haiku-4-5-20251001": { inputPerMTok: 1, outputPerMTok: 5, cacheWritePerMTok: 1.25, cacheReadPerMTok: 0.1 },
  "claude-haiku-4-5": { inputPerMTok: 1, outputPerMTok: 5, cacheWritePerMTok: 1.25, cacheReadPerMTok: 0.1 },
  "claude-sonnet-4-6": { inputPerMTok: 3, outputPerMTok: 15, cacheWritePerMTok: 3.75, cacheReadPerMTok: 0.3 },
  "claude-sonnet-4-5": { inputPerMTok: 3, outputPerMTok: 15, cacheWritePerMTok: 3.75, cacheReadPerMTok: 0.3 },
};

export function getGreenConfig() {
  const model = process.env.GREEN_MODEL || "claude-haiku-4-5-20251001";
  const knownPrice = MODEL_PRICES[model];
  const price: ModelPrice = {
    inputPerMTok: numberEnv("GREEN_PRICE_INPUT_PER_MTOK", knownPrice?.inputPerMTok ?? 1),
    outputPerMTok: numberEnv("GREEN_PRICE_OUTPUT_PER_MTOK", knownPrice?.outputPerMTok ?? 5),
    cacheWritePerMTok: numberEnv("GREEN_PRICE_CACHE_WRITE_PER_MTOK", knownPrice?.cacheWritePerMTok ?? 1.25),
    cacheReadPerMTok: numberEnv("GREEN_PRICE_CACHE_READ_PER_MTOK", knownPrice?.cacheReadPerMTok ?? 0.1),
  };
  return {
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    model,
    price,
    usdBrlFallback: numberEnv("USD_BRL_FALLBACK", 5.5),
    cardMarkup: numberEnv("FX_CARD_MARKUP", 1.06),
    feeRate: numberEnv("PAYMENT_FEE_RATE", 0.0099),
    marginRate: numberEnv("PROFIT_MARGIN_RATE", 0.4),
    minPaymentBrl: numberEnv("MIN_PAYMENT_BRL", 1),
    premiumDays: numberEnv("PREMIUM_DAYS", 30),
    premiumPriceBrl: numberEnv("PREMIUM_PRICE_BRL", 7.99),
    trialLimit: numberEnv("TRIAL_MESSAGES", 5),
    trialIntervalMs: numberEnv("TRIAL_INTERVAL_HOURS", 24) * 60 * 60 * 1000,
    freeMonthlyBudgetBrl: numberEnv("FREE_MONTHLY_BUDGET_BRL", 10),
    maxAttachmentBytes: numberEnv("MAX_ATTACHMENT_MB", 5) * 1024 * 1024,
    refundWindowDays: 7,
    historyMessages: 12,
    minSamplesForAverage: 20,
  };
}

export type GreenConfig = ReturnType<typeof getGreenConfig>;

export function getMercadoPagoConfig() {
  return {
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN ?? "",
    webhookSecret: process.env.MERCADO_PAGO_WEBHOOK_SECRET ?? "",
    publicBaseUrl: process.env.AUTH_URL ?? "http://localhost:3000",
  };
}

export function getSellerInfo() {
  return {
    name: process.env.SELLER_NAME ?? "",
    document: process.env.SELLER_DOCUMENT ?? "",
    email: process.env.SELLER_EMAIL ?? "",
    address: process.env.SELLER_ADDRESS ?? "",
  };
}
