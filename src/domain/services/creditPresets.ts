export interface CreditPreset {
  id: string;
  group: "messages" | "attachments" | "combo";
  priceBrl: number;
  attachmentShare: number;
}

const MESSAGE_PRICES = [2.99, 4.99, 9.99, 19.99, 49.99];
const ATTACHMENT_PRICES = [1.99, 4.99, 9.99];
const COMBO_PRICES = [9.99, 19.99, 49.99];

export const COMBO_ATTACHMENT_SHARE = 0.15;
export const RECOMMENDED_PRESET_ID = "c19.99";

export const CREDIT_PRESETS: CreditPreset[] = [
  ...MESSAGE_PRICES.map((p) => ({ id: `m${p}`, group: "messages" as const, priceBrl: p, attachmentShare: 0 })),
  ...ATTACHMENT_PRICES.map((p) => ({ id: `a${p}`, group: "attachments" as const, priceBrl: p, attachmentShare: 1 })),
  ...COMBO_PRICES.map((p) => ({ id: `c${p}`, group: "combo" as const, priceBrl: p, attachmentShare: COMBO_ATTACHMENT_SHARE })),
];

export function findPreset(id: string): CreditPreset | null {
  return CREDIT_PRESETS.find((p) => p.id === id) ?? null;
}

export const CUSTOM_LIMITS = { maxMessages: 1000, messageStep: 5, maxAttachments: 50, attachmentStep: 1 };
