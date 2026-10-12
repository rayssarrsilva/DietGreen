import type Anthropic from "@anthropic-ai/sdk";
import type {
  ChatTurn,
  ClassifiedLabValue,
  ExtractedLabValue,
  GreenAccountState,
  GreenSettingsState,
  GreenStyle,
  LabReport,
} from "@/domain/entities/green";
import { GREEN_STYLES } from "@/domain/entities/green";
import type { GreenStreamEvent, WalletSnapshot } from "@/domain/entities/wallet";
import type { GreenRepository } from "@/domain/repositories/greenInterfaces";
import type { MealPlanRepository } from "@/domain/repositories/interfaces";
import {
  decideAttachmentAccess,
  decideChatAccess,
  isPremiumActive,
  trialNextAvailableAt,
  type AccessPolicy,
} from "@/domain/services/chatAccess";
import { classifyLabValue } from "@/domain/services/labClassifier";
import { approximateUnits, costUsd, usdToBrl } from "@/domain/services/pricing";
import type { PricingService } from "@/application/green/pricingService";
import type { GreenConfig } from "@/infrastructure/config/greenConfig";
import { isAnthropicConfigured } from "@/infrastructure/ai/anthropicClient";
import { runGreenTurn } from "@/infrastructure/ai/greenAgent";
import { buildDynamicSystemPrompt, buildStaticSystemPrompt, STYLE_MAX_TOKENS } from "@/infrastructure/ai/greenPrompt";
import { executeGreenTool, GREEN_TOOLS } from "@/infrastructure/ai/greenTools";
import { extractLabResults, type AttachmentType } from "@/infrastructure/ai/labExtractor";
import { LAB_MARKERS } from "@/infrastructure/knowledge/labMarkers";
import { tryLockUser, unlockUser } from "@/infrastructure/http/requestGuards";

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; status: number; code: string; details?: Record<string, unknown> };

export interface ChatGrant {
  userId: string;
  mode: "trial" | "credits";
  trialRemainingAfter: number;
  account: GreenAccountState;
  settings: GreenSettingsState;
}

export interface SettingsPatch {
  greenStyle?: GreenStyle;
  greenCustomStyle?: string | null;
  adultConfirmed?: boolean;
  chatTermsAccepted?: boolean;
  healthProcessingConsent?: boolean;
  healthStorageConsent?: boolean;
}

const HISTORY_CHAR_LIMIT = 1500;
const BRT_OFFSET_MS = 3 * 60 * 60 * 1000;
let staticPrompt: string | null = null;

function monthStartBrazil(now: Date): Date {
  const local = new Date(now.getTime() - BRT_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) + BRT_OFFSET_MS);
}

function toApiMessages(history: ChatTurn[], userMessage: string): Anthropic.MessageParam[] {
  const turns = [...history, { role: "user" as const, content: userMessage }];
  const merged: Anthropic.MessageParam[] = [];
  for (const turn of turns) {
    const content = turn.content.length > HISTORY_CHAR_LIMIT && turn !== turns[turns.length - 1]
      ? `${turn.content.slice(0, HISTORY_CHAR_LIMIT)}…`
      : turn.content;
    const last = merged[merged.length - 1];
    if (last && last.role === turn.role) {
      last.content = `${last.content as string}\n\n${content}`;
    } else {
      merged.push({ role: turn.role, content });
    }
  }
  while (merged.length && merged[0].role !== "user") merged.shift();
  return merged;
}

export class GreenService {
  constructor(
    private readonly repo: GreenRepository,
    private readonly mealPlans: MealPlanRepository,
    private readonly pricing: PricingService,
    private readonly config: GreenConfig
  ) {}

  private async policy(): Promise<AccessPolicy & { avgMessageBrl: number; avgAttachmentBrl: number }> {
    const snapshot = await this.pricing.snapshot();
    const spent = await this.repo.sumCostBrlSince(["TRIAL"], monthStartBrazil(new Date()));
    return {
      trialLimit: this.config.trialLimit,
      trialIntervalMs: this.config.trialIntervalMs,
      minChatBalanceBrl: snapshot.params.avgMessageBrl * 0.3,
      minAttachmentBalanceBrl: snapshot.params.avgAttachmentBrl * 0.5,
      freeBudgetAvailable: spent < this.config.freeMonthlyBudgetBrl,
      avgMessageBrl: snapshot.params.avgMessageBrl,
      avgAttachmentBrl: snapshot.params.avgAttachmentBrl,
    };
  }

  async wallet(userId: string): Promise<WalletSnapshot> {
    const [account, policy] = await Promise.all([this.repo.getOrCreateAccount(userId), this.policy()]);
    return this.buildWallet(account, policy);
  }

  private buildWallet(
    account: GreenAccountState,
    policy: AccessPolicy & { avgMessageBrl: number; avgAttachmentBrl: number }
  ): WalletSnapshot {
    const now = new Date();
    const premiumActive = isPremiumActive(account, now);
    const trialRemaining = account.trialClosed ? 0 : Math.max(0, policy.trialLimit - account.trialMessagesUsed);
    const hasCredits =
      account.chatBalanceBrl >= policy.minChatBalanceBrl || account.attachmentBalanceBrl >= policy.minAttachmentBalanceBrl;
    const next = trialNextAvailableAt(account, policy);
    return {
      mode: hasCredits ? "credits" : trialRemaining > 0 ? "trial" : "empty",
      premiumActive,
      premiumUntil: account.premiumUntil?.toISOString() ?? null,
      canRefill: premiumActive,
      trial: {
        limit: policy.trialLimit,
        used: account.trialMessagesUsed,
        remaining: trialRemaining,
        nextAvailableAt: next && next > now ? next.toISOString() : null,
        closed: account.trialClosed,
        paused: !policy.freeBudgetAvailable,
      },
      chat: {
        balanceBrl: Math.max(0, account.chatBalanceBrl),
        capacityBrl: Math.max(account.chatCapacityBrl, account.chatBalanceBrl, 0),
        approxMessages: approximateUnits(account.chatBalanceBrl, policy.avgMessageBrl),
      },
      attachments: {
        balanceBrl: Math.max(0, account.attachmentBalanceBrl),
        capacityBrl: Math.max(account.attachmentCapacityBrl, account.attachmentBalanceBrl, 0),
        approxAttachments: approximateUnits(account.attachmentBalanceBrl, policy.avgAttachmentBrl),
      },
      avgMessageBrl: policy.avgMessageBrl,
      avgAttachmentBrl: policy.avgAttachmentBrl,
    };
  }

  async settings(userId: string): Promise<GreenSettingsState> {
    return this.repo.getSettings(userId);
  }

  async updateSettings(userId: string, patch: SettingsPatch): Promise<GreenSettingsState> {
    const now = new Date();
    const data: Partial<GreenSettingsState> = {};
    if (patch.greenStyle && GREEN_STYLES.includes(patch.greenStyle)) data.greenStyle = patch.greenStyle;
    if (patch.greenCustomStyle !== undefined) {
      const trimmed = patch.greenCustomStyle?.trim().slice(0, 500) ?? "";
      data.greenCustomStyle = trimmed || null;
    }
    if (patch.adultConfirmed !== undefined) data.adultConfirmedAt = patch.adultConfirmed ? now : null;
    if (patch.chatTermsAccepted !== undefined) data.chatTermsAcceptedAt = patch.chatTermsAccepted ? now : null;
    if (patch.healthProcessingConsent !== undefined) {
      data.healthProcessingConsentAt = patch.healthProcessingConsent ? now : null;
    }
    if (patch.healthStorageConsent !== undefined) data.healthStorageConsentAt = patch.healthStorageConsent ? now : null;
    if (patch.healthStorageConsent === false || patch.healthProcessingConsent === false) {
      data.healthStorageConsentAt = null;
      await this.repo.deleteAllLabReports(userId);
    }
    return this.repo.updateSettings(userId, data);
  }

  async conversation(userId: string, limit = 60): Promise<ChatTurn[]> {
    return this.repo.listChatMessages(userId, limit);
  }

  async clearConversation(userId: string): Promise<void> {
    await this.repo.clearChat(userId);
  }

  async authorizeChat(userId: string): Promise<ServiceResult<ChatGrant>> {
    const settings = await this.repo.getSettings(userId);
    if (!settings.adultConfirmedAt || !settings.chatTermsAcceptedAt) {
      return { ok: false, status: 403, code: "consent_required" };
    }
    if (!isAnthropicConfigured()) return { ok: false, status: 503, code: "ai_unavailable" };
    const [account, policy] = await Promise.all([this.repo.getOrCreateAccount(userId), this.policy()]);
    const access = decideChatAccess(account, new Date(), policy);
    if (!access.allowed) {
      return {
        ok: false,
        status: 402,
        code: access.reason,
        details: {
          ...(access.reason === "trial_wait" ? { retryAt: access.retryAt.toISOString() } : {}),
          ...(access.reason === "no_credits" ? { canRefill: access.canRefill } : {}),
          wallet: this.buildWallet(account, policy),
        },
      };
    }
    return {
      ok: true,
      data: {
        userId,
        mode: access.mode,
        trialRemainingAfter: access.mode === "trial" ? access.trialRemainingAfter : 0,
        account,
        settings,
      },
    };
  }

  async runChat(grant: ChatGrant, message: string, emit: (event: GreenStreamEvent) => void, signal?: AbortSignal): Promise<void> {
    const { userId } = grant;
    if (!tryLockUser(userId)) {
      emit({ type: "error", code: "busy", message: "Aguarde a resposta anterior terminar." });
      return;
    }
    let trialReserved = false;
    try {
      if (grant.mode === "trial") {
        trialReserved = await this.repo.reserveTrialMessage(userId, grant.account.trialMessagesUsed, new Date());
        if (!trialReserved) {
          emit({ type: "error", code: "trial_conflict", message: "Seu teste grátis mudou de estado. Atualize a página." });
          return;
        }
      }

      const history = await this.repo.listChatMessages(userId, this.config.historyMessages);
      await this.repo.appendChatMessage(userId, "user", message);

      staticPrompt ??= buildStaticSystemPrompt();
      const system: Anthropic.TextBlockParam[] = [
        { type: "text", text: staticPrompt, cache_control: { type: "ephemeral" } },
        {
          type: "text",
          text: buildDynamicSystemPrompt({
            style: grant.settings.greenStyle,
            customStyle: grant.settings.greenCustomStyle,
            mode: grant.mode,
            now: new Date(),
            trialRemainingAfter: grant.trialRemainingAfter,
          }),
        },
      ];

      const maxTokens = grant.mode === "trial"
        ? Math.max(STYLE_MAX_TOKENS[grant.settings.greenStyle], 1200)
        : STYLE_MAX_TOKENS[grant.settings.greenStyle];

      const result = await runGreenTurn({
        model: this.config.model,
        system,
        messages: toApiMessages(history, message),
        maxTokens,
        tools: GREEN_TOOLS,
        executeTool: (name, input) =>
          executeGreenTool(name, input, {
            userId,
            greenRepo: this.repo,
            mealPlans: this.mealPlans,
            canReadLabs: Boolean(grant.settings.healthStorageConsentAt),
          }),
        onText: (delta) => emit({ type: "text", delta }),
        signal,
      });

      const snapshot = await this.pricing.snapshot();
      const usd = costUsd(result.usage, this.config.price);
      const brl = usdToBrl(usd, snapshot.usdBrl, this.config.cardMarkup);
      await this.repo.recordUsage({
        userId,
        kind: grant.mode === "trial" ? "TRIAL" : "CHAT",
        model: this.config.model,
        usage: result.usage,
        apiCalls: result.apiCalls,
        costUsd: usd,
        costBrl: brl,
        usdBrlRate: snapshot.usdBrl,
      });
      if (grant.mode === "credits") await this.repo.debitChat(userId, brl);
      trialReserved = false;
      await this.repo.appendChatMessage(userId, "assistant", result.text || "…");
      emit({ type: "done", wallet: await this.wallet(userId) });
    } catch (err) {
      console.error("green chat failed", err);
      if (trialReserved) await this.repo.releaseTrialMessage(userId, grant.account.trialLastMessageAt).catch(() => undefined);
      emit({
        type: "error",
        code: "ai_failed",
        message: "A Green não conseguiu responder agora. Nada foi cobrado por esta tentativa; tente de novo em instantes.",
      });
    } finally {
      unlockUser(userId);
    }
  }

  async extractLabs(
    userId: string,
    file: { bytes: Buffer; mediaType: AttachmentType }
  ): Promise<ServiceResult<{ report: LabReport; isLabReport: boolean; wallet: WalletSnapshot }>> {
    const settings = await this.repo.getSettings(userId);
    if (!settings.adultConfirmedAt || !settings.chatTermsAcceptedAt) {
      return { ok: false, status: 403, code: "consent_required" };
    }
    if (!settings.healthProcessingConsentAt) return { ok: false, status: 403, code: "health_consent_required" };
    if (!isAnthropicConfigured()) return { ok: false, status: 503, code: "ai_unavailable" };
    if (file.bytes.length > this.config.maxAttachmentBytes) return { ok: false, status: 413, code: "file_too_large" };

    const [account, policy] = await Promise.all([this.repo.getOrCreateAccount(userId), this.policy()]);
    const access = decideAttachmentAccess(account, new Date(), policy);
    if (!access.allowed) {
      return { ok: false, status: 402, code: access.reason, details: { canRefill: access.canRefill, wallet: this.buildWallet(account, policy) } };
    }
    if (!tryLockUser(userId)) return { ok: false, status: 429, code: "busy" };
    try {
      const result = await extractLabResults({ model: this.config.model, bytes: file.bytes, mediaType: file.mediaType });
      const snapshot = await this.pricing.snapshot();
      const usd = costUsd(result.usage, this.config.price);
      const brl = usdToBrl(usd, snapshot.usdBrl, this.config.cardMarkup);
      await this.repo.recordUsage({
        userId,
        kind: "ATTACHMENT",
        model: this.config.model,
        usage: result.usage,
        apiCalls: 1,
        costUsd: usd,
        costBrl: brl,
        usdBrlRate: snapshot.usdBrl,
      });
      await this.repo.debitAttachment(userId, brl);
      return {
        ok: true,
        data: {
          isLabReport: result.isLabReport,
          report: {
            collectedAt: result.collectedAt,
            labName: result.labName,
            values: result.values.map((v) => classifyLabValue(v, LAB_MARKERS)),
          },
          wallet: await this.wallet(userId),
        },
      };
    } catch (err) {
      console.error("lab extraction failed", err);
      return { ok: false, status: 502, code: "extraction_failed" };
    } finally {
      unlockUser(userId);
    }
  }

  classify(values: ExtractedLabValue[]): ClassifiedLabValue[] {
    return values.map((v) => classifyLabValue(v, LAB_MARKERS));
  }

  async saveLabs(userId: string, report: { collectedAt: string | null; labName: string | null; values: ExtractedLabValue[] }): Promise<ServiceResult<{ id: string }>> {
    const settings = await this.repo.getSettings(userId);
    if (!settings.healthStorageConsentAt) return { ok: false, status: 403, code: "storage_consent_required" };
    const id = await this.repo.saveLabReport(userId, {
      collectedAt: report.collectedAt,
      labName: report.labName,
      values: this.classify(report.values),
    });
    return { ok: true, data: { id } };
  }

  async listLabs(userId: string): Promise<LabReport[]> {
    return this.repo.listLabReports(userId);
  }

  async deleteLab(userId: string, id: string): Promise<void> {
    await this.repo.deleteLabReport(userId, id);
  }

  async deleteAllLabs(userId: string): Promise<void> {
    await this.repo.deleteAllLabReports(userId);
  }
}
