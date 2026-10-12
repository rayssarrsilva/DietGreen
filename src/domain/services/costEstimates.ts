import type { ModelPrice } from "@/domain/entities/green";
import { costUsd, usdToBrl } from "@/domain/services/pricing";

export const TYPICAL_MESSAGE_USAGE = {
  inputTokens: 7000,
  outputTokens: 650,
  cacheWriteTokens: 0,
  cacheReadTokens: 0,
};

export const TYPICAL_ATTACHMENT_USAGE = {
  inputTokens: 9000,
  outputTokens: 1600,
  cacheWriteTokens: 0,
  cacheReadTokens: 0,
};

export function estimateDefaultCostsBrl(price: ModelPrice, usdBrl: number, cardMarkup: number) {
  return {
    message: usdToBrl(costUsd(TYPICAL_MESSAGE_USAGE, price), usdBrl, cardMarkup),
    attachment: usdToBrl(costUsd(TYPICAL_ATTACHMENT_USAGE, price), usdBrl, cardMarkup),
  };
}
