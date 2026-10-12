import { prisma } from "@/infrastructure/db/prisma";
import { decryptJson, decryptText, encryptJson, encryptText } from "@/infrastructure/crypto/dataCipher";
import type {
  ChatRole,
  ChatTurn,
  GreenAccountState,
  GreenSettingsState,
  GreenStyle,
  LabReport,
} from "@/domain/entities/green";
import { GREEN_STYLES } from "@/domain/entities/green";
import type { GreenRepository, UsageKindValue, UsageRecord } from "@/domain/repositories/greenInterfaces";

function num(value: { toString(): string } | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value.toString());
}

function toAccountState(row: {
  chatBalanceBrl: { toString(): string };
  attachmentBalanceBrl: { toString(): string };
  chatCapacityBrl: { toString(): string };
  attachmentCapacityBrl: { toString(): string };
  premiumUntil: Date | null;
  trialMessagesUsed: number;
  trialLastMessageAt: Date | null;
  trialClosed: boolean;
}): GreenAccountState {
  return {
    chatBalanceBrl: num(row.chatBalanceBrl),
    attachmentBalanceBrl: num(row.attachmentBalanceBrl),
    chatCapacityBrl: num(row.chatCapacityBrl),
    attachmentCapacityBrl: num(row.attachmentCapacityBrl),
    premiumUntil: row.premiumUntil,
    trialMessagesUsed: row.trialMessagesUsed,
    trialLastMessageAt: row.trialLastMessageAt,
    trialClosed: row.trialClosed,
  };
}

function toStyle(value: string | null | undefined): GreenStyle {
  return GREEN_STYLES.includes(value as GreenStyle) ? (value as GreenStyle) : "direct";
}

export class PrismaGreenRepository implements GreenRepository {
  async getOrCreateAccount(userId: string): Promise<GreenAccountState> {
    const row = await prisma.greenAccount.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    return toAccountState(row);
  }

  async getSettings(userId: string): Promise<GreenSettingsState> {
    const row = await prisma.userSettings.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    return {
      greenStyle: toStyle(row.greenStyle),
      greenCustomStyle: row.greenCustomStyle,
      adultConfirmedAt: row.adultConfirmedAt,
      chatTermsAcceptedAt: row.chatTermsAcceptedAt,
      healthProcessingConsentAt: row.healthProcessingConsentAt,
      healthStorageConsentAt: row.healthStorageConsentAt,
    };
  }

  async updateSettings(userId: string, patch: Partial<GreenSettingsState>): Promise<GreenSettingsState> {
    await prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...patch },
      update: patch,
    });
    return this.getSettings(userId);
  }

  async reserveTrialMessage(userId: string, expectedUsed: number, now: Date): Promise<boolean> {
    const result = await prisma.greenAccount.updateMany({
      where: { userId, trialMessagesUsed: expectedUsed, trialClosed: false },
      data: { trialMessagesUsed: { increment: 1 }, trialLastMessageAt: now },
    });
    return result.count === 1;
  }

  async releaseTrialMessage(userId: string, previousLastAt: Date | null): Promise<void> {
    await prisma.greenAccount.updateMany({
      where: { userId, trialMessagesUsed: { gt: 0 } },
      data: { trialMessagesUsed: { decrement: 1 }, trialLastMessageAt: previousLastAt },
    });
  }

  async recordUsage(record: UsageRecord): Promise<void> {
    await prisma.usageEvent.create({
      data: {
        userId: record.userId,
        kind: record.kind,
        model: record.model,
        inputTokens: record.usage.inputTokens,
        outputTokens: record.usage.outputTokens,
        cacheWriteTokens: record.usage.cacheWriteTokens,
        cacheReadTokens: record.usage.cacheReadTokens,
        apiCalls: record.apiCalls,
        costUsd: record.costUsd.toFixed(8),
        costBrl: record.costBrl.toFixed(6),
        usdBrlRate: record.usdBrlRate.toFixed(4),
      },
    });
  }

  async debitChat(userId: string, amountBrl: number): Promise<void> {
    await prisma.greenAccount.update({
      where: { userId },
      data: { chatBalanceBrl: { decrement: amountBrl.toFixed(6) } },
    });
  }

  async debitAttachment(userId: string, amountBrl: number): Promise<void> {
    await prisma.greenAccount.update({
      where: { userId },
      data: { attachmentBalanceBrl: { decrement: amountBrl.toFixed(6) } },
    });
  }

  async sumCostBrlSince(kinds: UsageKindValue[], since: Date): Promise<number> {
    const result = await prisma.usageEvent.aggregate({
      where: { kind: { in: kinds }, createdAt: { gte: since } },
      _sum: { costBrl: true },
    });
    return num(result._sum.costBrl);
  }

  async averageCostBrl(kinds: UsageKindValue[], since: Date): Promise<{ average: number; count: number }> {
    const result = await prisma.usageEvent.aggregate({
      where: { kind: { in: kinds }, createdAt: { gte: since } },
      _avg: { costBrl: true },
      _count: { _all: true },
    });
    return { average: num(result._avg.costBrl), count: result._count._all };
  }

  async appendChatMessage(userId: string, role: ChatRole, content: string): Promise<void> {
    await prisma.chatMessage.create({
      data: { userId, role, encryptedContent: encryptText(content) },
    });
  }

  async listChatMessages(userId: string, limit: number): Promise<ChatTurn[]> {
    const rows = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.reverse().flatMap((row) => {
      try {
        return [{ role: row.role as ChatRole, content: decryptText(row.encryptedContent), createdAt: row.createdAt }];
      } catch {
        return [];
      }
    });
  }

  async clearChat(userId: string): Promise<void> {
    await prisma.chatMessage.deleteMany({ where: { userId } });
  }

  async saveLabReport(userId: string, report: LabReport): Promise<string> {
    const row = await prisma.labResult.create({
      data: { userId, encryptedPayload: encryptJson({ collectedAt: report.collectedAt, labName: report.labName, values: report.values }) },
    });
    return row.id;
  }

  async listLabReports(userId: string): Promise<LabReport[]> {
    const rows = await prisma.labResult.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return rows.flatMap((row) => {
      try {
        const data = decryptJson<Omit<LabReport, "id" | "savedAt">>(row.encryptedPayload);
        return [{ ...data, id: row.id, savedAt: row.createdAt.toISOString() }];
      } catch {
        return [];
      }
    });
  }

  async deleteLabReport(userId: string, id: string): Promise<void> {
    await prisma.labResult.deleteMany({ where: { id, userId } });
  }

  async deleteAllLabReports(userId: string): Promise<void> {
    await prisma.labResult.deleteMany({ where: { userId } });
  }
}
