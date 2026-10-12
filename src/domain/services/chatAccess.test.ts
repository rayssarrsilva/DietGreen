import { describe, expect, it } from "vitest";
import { decideAttachmentAccess, decideChatAccess, type AccessPolicy } from "./chatAccess";
import type { GreenAccountState } from "@/domain/entities/green";

const now = new Date("2026-10-01T12:00:00Z");
const policy: AccessPolicy = { trialLimit: 5, trialIntervalMs: 86_400_000, minChatBalanceBrl: 0.02, minAttachmentBalanceBrl: 0.05, freeBudgetAvailable: true };
const base: GreenAccountState = { chatBalanceBrl: 0, attachmentBalanceBrl: 0, chatCapacityBrl: 0, attachmentCapacityBrl: 0, premiumUntil: null, trialMessagesUsed: 0, trialLastMessageAt: null, trialClosed: false };

describe("chat access", () => {
  it("allows first trial message", () => {
    expect(decideChatAccess(base, now, policy)).toEqual({ allowed: true, mode: "trial", trialRemainingAfter: 4 });
  });
  it("enforces 24h between trial messages", () => {
    const r = decideChatAccess({ ...base, trialMessagesUsed: 1, trialLastMessageAt: new Date(now.getTime() - 3_600_000) }, now, policy);
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reason).toBe("trial_wait");
  });
  it("requires premium after trial", () => {
    expect(decideChatAccess({ ...base, trialMessagesUsed: 5 }, now, policy)).toEqual({ allowed: false, reason: "premium_required" });
  });
  it("pauses trial when free budget is exhausted", () => {
    expect(decideChatAccess(base, now, { ...policy, freeBudgetAvailable: false })).toEqual({ allowed: false, reason: "trial_paused" });
  });
  it("keeps credits usable after premium expires", () => {
    expect(decideChatAccess({ ...base, trialClosed: true, chatBalanceBrl: 1, premiumUntil: new Date(now.getTime() - 1) }, now, policy)).toEqual({ allowed: true, mode: "credits" });
  });
  it("asks to refill when premium active and no credits", () => {
    expect(decideChatAccess({ ...base, trialClosed: true, premiumUntil: new Date(now.getTime() + 1000) }, now, policy)).toEqual({ allowed: false, reason: "no_credits", canRefill: true });
  });
  it("blocks attachments during trial", () => {
    const r = decideAttachmentAccess(base, now, policy);
    expect(r.allowed).toBe(false);
  });
});
