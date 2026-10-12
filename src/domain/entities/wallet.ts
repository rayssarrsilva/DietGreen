export interface WalletSnapshot {
  mode: "trial" | "credits" | "empty";
  premiumActive: boolean;
  premiumUntil: string | null;
  canRefill: boolean;
  trial: {
    limit: number;
    used: number;
    remaining: number;
    nextAvailableAt: string | null;
    closed: boolean;
    paused: boolean;
  };
  chat: { balanceBrl: number; capacityBrl: number; approxMessages: number };
  attachments: { balanceBrl: number; capacityBrl: number; approxAttachments: number };
  avgMessageBrl: number;
  avgAttachmentBrl: number;
}

export type GreenStreamEvent =
  | { type: "text"; delta: string }
  | { type: "done"; wallet: WalletSnapshot }
  | { type: "error"; code: string; message: string };
