/*
  Warnings:

  - You are about to drop the column `respondedAt` on the `LeadAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `autoAcceptMode` on the `ProProfile` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ProProfile_autoAcceptMode_lastExclusiveLeadAt_idx";

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "matchingStartedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "LeadAssignment" DROP COLUMN "respondedAt",
ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "radiusKmAtAssignment" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "refusalReason" TEXT,
ADD COLUMN     "refusedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProProfile" DROP COLUMN "autoAcceptMode",
ADD COLUMN     "autoAccept" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLeadReceivedAt" TIMESTAMP(3),
ALTER COLUMN "walletBalanceCents" SET DEFAULT 100000;

-- DropEnum
DROP TYPE "AutoAcceptMode";
