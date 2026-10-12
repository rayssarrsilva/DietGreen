import type { GreenAccountState } from "@/domain/entities/green";

export interface AccessPolicy {
  trialLimit: number;
  trialIntervalMs: number;
  minChatBalanceBrl: number;
  minAttachmentBalanceBrl: number;
  freeBudgetAvailable: boolean;
}

export type ChatAccess =
  | { allowed: true; mode: "trial"; trialRemainingAfter: number }
  | { allowed: true; mode: "credits" }
  | { allowed: false; reason: "trial_wait"; retryAt: Date }
  | { allowed: false; reason: "trial_paused" }
  | { allowed: false; reason: "premium_required" }
  | { allowed: false; reason: "no_credits"; canRefill: boolean };

export type AttachmentAccess =
  | { allowed: true }
  | { allowed: false; reason: "premium_required" | "no_attachment_credits"; canRefill: boolean };

export function isPremiumActive(account: GreenAccountState, now: Date): boolean {
  return Boolean(account.premiumUntil && account.premiumUntil.getTime() > now.getTime());
}

export function decideChatAccess(
  account: GreenAccountState,
  now: Date,
  policy: AccessPolicy
): ChatAccess {
  if (account.chatBalanceBrl >= policy.minChatBalanceBrl) {
    return { allowed: true, mode: "credits" };
  }

  const premium = isPremiumActive(account, now);

  if (!account.trialClosed && account.trialMessagesUsed < policy.trialLimit) {
    if (account.trialLastMessageAt) {
      const nextAt = account.trialLastMessageAt.getTime() + policy.trialIntervalMs;
      if (nextAt > now.getTime()) {
        return { allowed: false, reason: "trial_wait", retryAt: new Date(nextAt) };
      }
    }
    if (!policy.freeBudgetAvailable) return { allowed: false, reason: "trial_paused" };
    return {
      allowed: true,
      mode: "trial",
      trialRemainingAfter: policy.trialLimit - account.trialMessagesUsed - 1,
    };
  }

  if (premium) return { allowed: false, reason: "no_credits", canRefill: true };
  return { allowed: false, reason: "premium_required" };
}

export function decideAttachmentAccess(
  account: GreenAccountState,
  now: Date,
  policy: AccessPolicy
): AttachmentAccess {
  const premium = isPremiumActive(account, now);
  if (account.attachmentBalanceBrl >= policy.minAttachmentBalanceBrl) return { allowed: true };
  if (!premium && !account.trialClosed) {
    return { allowed: false, reason: "premium_required", canRefill: false };
  }
  return { allowed: false, reason: "no_attachment_credits", canRefill: premium };
}

export function trialNextAvailableAt(
  account: GreenAccountState,
  policy: Pick<AccessPolicy, "trialLimit" | "trialIntervalMs">
): Date | null {
  if (account.trialClosed || account.trialMessagesUsed >= policy.trialLimit) return null;
  if (!account.trialLastMessageAt) return null;
  return new Date(account.trialLastMessageAt.getTime() + policy.trialIntervalMs);
}
