-- CreateEnum
CREATE TYPE "LeadFollowupStatus" AS ENUM ('PENDING', 'CONVERTED', 'NO_FOLLOWUP', 'NOT_REACHABLE');

-- AlterTable
ALTER TABLE "LeadAssignment" ADD COLUMN "followupStatus" "LeadFollowupStatus" NOT NULL DEFAULT 'PENDING';
