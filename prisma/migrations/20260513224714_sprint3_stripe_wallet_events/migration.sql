-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN     "stripeCheckoutSessionId" TEXT;

-- CreateTable
CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proProfileId" TEXT,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StripeWebhookEvent_stripeEventId_key" ON "StripeWebhookEvent"("stripeEventId");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_eventType_idx" ON "StripeWebhookEvent"("eventType");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_processedAt_idx" ON "StripeWebhookEvent"("processedAt");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_proProfileId_idx" ON "StripeWebhookEvent"("proProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_stripeCheckoutSessionId_key" ON "WalletTransaction"("stripeCheckoutSessionId");
