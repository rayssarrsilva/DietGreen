import type { ModelPrice, TokenUsage } from "@/domain/entities/green";
import type { CreditPreset } from "@/domain/services/creditPresets";

export interface PricingParams {
  avgMessageBrl: number;
  avgAttachmentBrl: number;
  feeRate: number;
  marginRate: number;
  minPaymentBrl: number;
}

export interface CreditQuote {
  messages: number;
  attachments: number;
  chatCreditBrl: number;
  attachmentCreditBrl: number;
  aiCostBrl: number;
  feeBrl: number;
  marginBrl: number;
  totalBrl: number;
  minimumApplied: boolean;
}

export interface PremiumQuote {
  trialMessagesCovered: number;
  aiCostBrl: number;
  feeBrl: number;
  marginBrl: number;
  totalBrl: number;
  days: number;
  minimumApplied: boolean;
}

export const MAX_MESSAGES_PER_PURCHASE = 2000;
export const MAX_ATTACHMENTS_PER_PURCHASE = 100;

export function costUsd(usage: TokenUsage, price: ModelPrice): number {
  return (
    (usage.inputTokens * price.inputPerMTok +
      usage.outputTokens * price.outputPerMTok +
      usage.cacheWriteTokens * price.cacheWritePerMTok +
      usage.cacheReadTokens * price.cacheReadPerMTok) /
    1_000_000
  );
}

export function usdToBrl(usd: number, usdBrlRate: number, cardMarkup: number): number {
  return usd * usdBrlRate * cardMarkup;
}

export function ceilCents(value: number): number {
  return Math.ceil(value * 100 - 1e-7) / 100;
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function charmPrice(value: number): number {
  if (value <= 0) return 0;
  const v = ceilCents(value);
  if (v >= 100) return roundTo(Math.ceil((v + 0.1) / 10 - 1e-9) * 10 - 0.1, 2);
  const whole = Math.floor(v);
  const endings = v < 20 ? [0.49, 0.99] : [0.99];
  for (const ending of endings) {
    if (whole + ending >= v - 1e-9) return roundTo(whole + ending, 2);
  }
  return roundTo(whole + 1 + endings[0], 2);
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

export function quoteCredits(
  messagesInput: number,
  attachmentsInput: number,
  params: PricingParams
): CreditQuote {
  const messages = clampInt(messagesInput, 0, MAX_MESSAGES_PER_PURCHASE);
  const attachments = clampInt(attachmentsInput, 0, MAX_ATTACHMENTS_PER_PURCHASE);
  const chatCreditBrl = messages * params.avgMessageBrl;
  const attachmentCreditBrl = attachments * params.avgAttachmentBrl;
  const aiCostBrl = chatCreditBrl + attachmentCreditBrl;

  if (aiCostBrl <= 0) {
    return {
      messages,
      attachments,
      chatCreditBrl: 0,
      attachmentCreditBrl: 0,
      aiCostBrl: 0,
      feeBrl: 0,
      marginBrl: 0,
      totalBrl: 0,
      minimumApplied: false,
    };
  }

  const markup = 1 + params.marginRate;
  const rawTotal = (markup * aiCostBrl) / (1 - markup * params.feeRate);
  const rounded = ceilCents(rawTotal);
  const totalBrl = charmPrice(Math.max(rounded, params.minPaymentBrl));
  const feeBrl = totalBrl * params.feeRate;
  const marginBrl = totalBrl - aiCostBrl - feeBrl;

  return {
    messages,
    attachments,
    chatCreditBrl: roundTo(chatCreditBrl, 6),
    attachmentCreditBrl: roundTo(attachmentCreditBrl, 6),
    aiCostBrl: roundTo(aiCostBrl, 6),
    feeBrl: roundTo(feeBrl, 4),
    marginBrl: roundTo(marginBrl, 4),
    totalBrl,
    minimumApplied: rounded < params.minPaymentBrl,
  };
}

export function quotePricePoint(preset: CreditPreset, params: PricingParams): CreditQuote | null {
  const markup = 1 + params.marginRate;
  const aiBudget = (preset.priceBrl * (1 - markup * params.feeRate)) / markup;
  const attachments = preset.attachmentShare > 0
    ? Math.max(preset.attachmentShare < 1 ? 1 : 0, Math.floor((aiBudget * preset.attachmentShare) / params.avgAttachmentBrl + 1e-9))
    : 0;
  const remaining = aiBudget - attachments * params.avgAttachmentBrl;
  const messages = preset.attachmentShare < 1 ? Math.max(0, Math.floor(remaining / params.avgMessageBrl + 1e-9)) : 0;
  if (messages + attachments === 0 || messages > MAX_MESSAGES_PER_PURCHASE || attachments > MAX_ATTACHMENTS_PER_PURCHASE) return null;
  const chatCreditBrl = messages * params.avgMessageBrl;
  const attachmentCreditBrl = attachments * params.avgAttachmentBrl;
  const aiCostBrl = chatCreditBrl + attachmentCreditBrl;
  const feeBrl = preset.priceBrl * params.feeRate;
  return {
    messages,
    attachments,
    chatCreditBrl: roundTo(chatCreditBrl, 6),
    attachmentCreditBrl: roundTo(attachmentCreditBrl, 6),
    aiCostBrl: roundTo(aiCostBrl, 6),
    feeBrl: roundTo(feeBrl, 4),
    marginBrl: roundTo(preset.priceBrl - aiCostBrl - feeBrl, 4),
    totalBrl: preset.priceBrl,
    minimumApplied: false,
  };
}

export function quotePremium(
  params: PricingParams,
  trialMessagesCovered: number,
  days: number,
  basePriceBrl: number
): PremiumQuote {
  const aiCostBrl = trialMessagesCovered * params.avgMessageBrl;
  const costFloor = ceilCents(aiCostBrl / (1 - params.feeRate));
  const totalBrl = charmPrice(Math.max(basePriceBrl, costFloor, params.minPaymentBrl));
  const feeBrl = totalBrl * params.feeRate;
  return {
    trialMessagesCovered,
    aiCostBrl: roundTo(aiCostBrl, 6),
    feeBrl: roundTo(feeBrl, 4),
    marginBrl: roundTo(totalBrl - aiCostBrl - feeBrl, 4),
    totalBrl,
    days,
    minimumApplied: costFloor > basePriceBrl,
  };
}

export function approximateUnits(balanceBrl: number, unitCostBrl: number): number {
  if (unitCostBrl <= 0 || balanceBrl <= 0) return 0;
  return Math.floor(balanceBrl / unitCostBrl + 1e-9);
}

export function proportionalRefund(
  paidBrl: number,
  creditedBrl: number,
  remainingBalanceBrl: number
): { refundBrl: number; creditsToRemoveBrl: number } {
  if (paidBrl <= 0 || creditedBrl <= 0) return { refundBrl: 0, creditsToRemoveBrl: 0 };
  const unused = Math.max(0, Math.min(creditedBrl, remainingBalanceBrl));
  const fraction = unused / creditedBrl;
  return {
    refundBrl: Math.floor(paidBrl * fraction * 100 + 1e-7) / 100,
    creditsToRemoveBrl: roundTo(unused, 6),
  };
}
