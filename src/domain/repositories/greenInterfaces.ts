import type {
  ChatRole,
  ChatTurn,
  GreenAccountState,
  GreenSettingsState,
  LabReport,
  TokenUsage,
} from "@/domain/entities/green";

export type UsageKindValue = "TRIAL" | "CHAT" | "ATTACHMENT";
export type PaymentKindValue = "PREMIUM" | "CREDITS";
export type PaymentStatusValue =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export interface UsageRecord {
  userId: string;
  kind: UsageKindValue;
  model: string;
  usage: TokenUsage;
  apiCalls: number;
  costUsd: number;
  costBrl: number;
  usdBrlRate: number;
}

export interface GreenRepository {
  getOrCreateAccount(userId: string): Promise<GreenAccountState>;
  getSettings(userId: string): Promise<GreenSettingsState>;
  updateSettings(userId: string, patch: Partial<GreenSettingsState>): Promise<GreenSettingsState>;
  reserveTrialMessage(userId: string, expectedUsed: number, now: Date): Promise<boolean>;
  releaseTrialMessage(userId: string, previousLastAt: Date | null): Promise<void>;
  recordUsage(record: UsageRecord): Promise<void>;
  debitChat(userId: string, amountBrl: number): Promise<void>;
  debitAttachment(userId: string, amountBrl: number): Promise<void>;
  sumCostBrlSince(kinds: UsageKindValue[], since: Date): Promise<number>;
  averageCostBrl(kinds: UsageKindValue[], since: Date): Promise<{ average: number; count: number }>;
  appendChatMessage(userId: string, role: ChatRole, content: string): Promise<void>;
  listChatMessages(userId: string, limit: number): Promise<ChatTurn[]>;
  clearChat(userId: string): Promise<void>;
  saveLabReport(userId: string, report: LabReport): Promise<string>;
  listLabReports(userId: string): Promise<LabReport[]>;
  deleteLabReport(userId: string, id: string): Promise<void>;
  deleteAllLabReports(userId: string): Promise<void>;
}

export interface PaymentRecord {
  id: string;
  userId: string | null;
  kind: PaymentKindValue;
  status: PaymentStatusValue;
  providerPaymentId: string | null;
  amountBrl: number;
  feeBrl: number;
  marginBrl: number;
  chatCreditBrl: number;
  attachmentCreditBrl: number;
  messagesQty: number;
  attachmentsQty: number;
  premiumDays: number;
  refundedAmountBrl: number;
  createdAt: Date;
  approvedAt: Date | null;
  refundedAt: Date | null;
}

export interface NewPayment {
  userId: string;
  kind: PaymentKindValue;
  amountBrl: number;
  feeBrl: number;
  marginBrl: number;
  chatCreditBrl: number;
  attachmentCreditBrl: number;
  messagesQty: number;
  attachmentsQty: number;
  premiumDays: number;
  quote: unknown;
}

export interface PaymentRepository {
  create(data: NewPayment): Promise<PaymentRecord>;
  findById(id: string): Promise<PaymentRecord | null>;
  setProviderPaymentId(id: string, providerPaymentId: string): Promise<void>;
  markStatus(id: string, status: PaymentStatusValue): Promise<void>;
  applyApproved(id: string, now: Date): Promise<boolean>;
  listByUser(userId: string): Promise<PaymentRecord[]>;
  applyRefund(id: string, refundBrl: number, creditsToRemove: { chat: number; attachment: number }, endPremium: boolean, now: Date): Promise<void>;
  hasApprovedCreditsAfter(userId: string, date: Date): Promise<boolean>;
}
