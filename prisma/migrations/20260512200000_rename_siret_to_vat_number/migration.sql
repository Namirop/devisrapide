-- AlterTable
ALTER TABLE "ProProfile" RENAME COLUMN "siret" TO "vatNumber";

-- CreateIndex
CREATE UNIQUE INDEX "ProProfile_vatNumber_key" ON "ProProfile"("vatNumber");
