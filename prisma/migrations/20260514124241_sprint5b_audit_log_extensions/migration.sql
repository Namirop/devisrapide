-- CreateEnum
CREATE TYPE "AuditLogStatus" AS ENUM ('SUCCESS', 'FAILURE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'PRO_REACTIVATED';
ALTER TYPE "AuditAction" ADD VALUE 'PRO_PROFILE_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'LEAD_GIFTED';

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "status" "AuditLogStatus" NOT NULL DEFAULT 'SUCCESS';

-- CreateIndex
CREATE INDEX "AuditLog_status_createdAt_idx" ON "AuditLog"("status", "createdAt");
