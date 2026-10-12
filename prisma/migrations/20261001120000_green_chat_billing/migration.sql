-- CreateEnum
CREATE TYPE "UsageKind" AS ENUM ('TRIAL', 'CHAT', 'ATTACHMENT');

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('PREMIUM', 'CREDITS');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN "greenStyle" TEXT NOT NULL DEFAULT 'direct',
ADD COLUMN "greenCustomStyle" TEXT,
ADD COLUMN "adultConfirmedAt" TIMESTAMP(3),
ADD COLUMN "chatTermsAcceptedAt" TIMESTAMP(3),
ADD COLUMN "healthProcessingConsentAt" TIMESTAMP(3),
ADD COLUMN "healthStorageConsentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "GreenAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chatBalanceBrl" DECIMAL(14,6) NOT NULL DEFAULT 0,
    "attachmentBalanceBrl" DECIMAL(14,6) NOT NULL DEFAULT 0,
    "chatCapacityBrl" DECIMAL(14,6) NOT NULL DEFAULT 0,
    "attachmentCapacityBrl" DECIMAL(14,6) NOT NULL DEFAULT 0,
    "premiumUntil" TIMESTAMP(3),
    "trialMessagesUsed" INTEGER NOT NULL DEFAULT 0,
    "trialLastMessageAt" TIMESTAMP(3),
    "trialClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GreenAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "encryptedContent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "UsageKind" NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "cacheWriteTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheReadTokens" INTEGER NOT NULL DEFAULT 0,
    "apiCalls" INTEGER NOT NULL DEFAULT 1,
    "costUsd" DECIMAL(14,8) NOT NULL,
    "costBrl" DECIMAL(14,6) NOT NULL,
    "usdBrlRate" DECIMAL(10,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encryptedPayload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "kind" "PaymentKind" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "providerPaymentId" TEXT,
    "amountBrl" DECIMAL(12,2) NOT NULL,
    "feeBrl" DECIMAL(12,4) NOT NULL,
    "marginBrl" DECIMAL(12,4) NOT NULL,
    "chatCreditBrl" DECIMAL(14,6) NOT NULL DEFAULT 0,
    "attachmentCreditBrl" DECIMAL(14,6) NOT NULL DEFAULT 0,
    "messagesQty" INTEGER NOT NULL DEFAULT 0,
    "attachmentsQty" INTEGER NOT NULL DEFAULT 0,
    "premiumDays" INTEGER NOT NULL DEFAULT 0,
    "refundedAmountBrl" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "quote" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "usdBrl" DECIMAL(10,4) NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GreenAccount_userId_key" ON "GreenAccount"("userId");

-- CreateIndex
CREATE INDEX "ChatMessage_userId_createdAt_idx" ON "ChatMessage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UsageEvent_userId_createdAt_idx" ON "UsageEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UsageEvent_kind_createdAt_idx" ON "UsageEvent"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "LabResult_userId_createdAt_idx" ON "LabResult"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerPaymentId_key" ON "Payment"("providerPaymentId");

-- CreateIndex
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_day_key" ON "ExchangeRate"("day");

-- CreateIndex
CREATE INDEX "AccessLog_createdAt_idx" ON "AccessLog"("createdAt");

-- AddForeignKey
ALTER TABLE "GreenAccount" ADD CONSTRAINT "GreenAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
