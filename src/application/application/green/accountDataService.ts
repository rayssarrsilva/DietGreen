import { prisma } from "@/infrastructure/db/prisma";
import type { GreenRepository } from "@/domain/repositories/greenInterfaces";

export class AccountDataService {
  constructor(private readonly repo: GreenRepository) {}

  async export(userId: string) {
    const [user, settings, account, chat, labs, payments, usage, plans] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, createdAt: true } }),
      this.repo.getSettings(userId),
      this.repo.getOrCreateAccount(userId),
      this.repo.listChatMessages(userId, 10_000),
      this.repo.listLabReports(userId),
      prisma.payment.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.usageEvent.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { kind: true, model: true, inputTokens: true, outputTokens: true, costBrl: true, createdAt: true },
      }),
      prisma.mealPlan.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      user,
      settings,
      greenAccount: account,
      chatMessages: chat,
      labResults: labs,
      payments: payments.map((p) => ({
        id: p.id,
        kind: p.kind,
        status: p.status,
        amountBrl: p.amountBrl.toString(),
        messagesQty: p.messagesQty,
        attachmentsQty: p.attachmentsQty,
        premiumDays: p.premiumDays,
        refundedAmountBrl: p.refundedAmountBrl.toString(),
        createdAt: p.createdAt,
        approvedAt: p.approvedAt,
      })),
      usage: usage.map((u) => ({ ...u, costBrl: u.costBrl.toString() })),
      mealPlans: plans,
    };
  }

  async deleteAccount(userId: string): Promise<void> {
    await prisma.user.delete({ where: { id: userId } });
  }
}
