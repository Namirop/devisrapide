-- Data migration : couplee a la migration sprint5b_admin_gift_note qui
-- a ajoute la colonne adminGiftNote. Sprint 4 stockait la note admin
-- "Offrir un lead" dans refusalReason (overload semantique). On copie
-- vers adminGiftNote pour les assignments adminGifted ayant un
-- refusalReason, puis on nettoie refusalReason (qui ne doit plus
-- contenir une note admin sur un assignment ACCEPTED).
--
-- Idempotente : no-op si aucune ligne ne matche (par exemple sur une
-- BDD fraichement deployee en prod, ou apres une 1ere application).
UPDATE "LeadAssignment"
SET "adminGiftNote" = "refusalReason",
    "refusalReason" = NULL
WHERE "adminGifted" = true
  AND "refusalReason" IS NOT NULL;
