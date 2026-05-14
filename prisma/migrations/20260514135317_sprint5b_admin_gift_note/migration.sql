-- AlterTable : ajoute adminGiftNote a LeadAssignment.
ALTER TABLE "LeadAssignment" ADD COLUMN "adminGiftNote" TEXT;

-- Data migration : Sprint 4 stockait la note admin "Offrir un lead" dans
-- refusalReason (overload semantique). On copie vers adminGiftNote
-- pour les assignments adminGifted ayant un refusalReason, puis on
-- nettoie refusalReason (qui ne doit plus contenir une note admin sur
-- un assignment ACCEPTED). Idempotent (no-op si aucune ligne).
UPDATE "LeadAssignment"
SET "adminGiftNote" = "refusalReason",
    "refusalReason" = NULL
WHERE "adminGifted" = true
  AND "refusalReason" IS NOT NULL;
