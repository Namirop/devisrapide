-- AlterTable
ALTER TABLE "LeadAssignment" ADD COLUMN     "adminGifted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "adminGiftedBy" TEXT;

-- AlterTable
ALTER TABLE "ProProfile" ADD COLUMN     "suspensionReason" TEXT;

-- CreateIndex
CREATE INDEX "LeadAssignment_adminGifted_idx" ON "LeadAssignment"("adminGifted");
