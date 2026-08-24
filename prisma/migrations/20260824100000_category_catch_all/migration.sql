-- Categorie "fourre-tout" : ses leads sont diffuses a tout pro valide de la
-- zone (pas de filtre d'abonnement) et ne declenchent jamais l'auto-accept.
--
-- Contexte : les particuliers qui ne trouvent pas leur metier choisissent
-- "Autre", mais aucun pro ne pense a cocher cette categorie a l'inscription.
-- Ces leads ne matchaient donc personne et finissaient offerts a la main.
ALTER TABLE "Category" ADD COLUMN "isCatchAll" BOOLEAN NOT NULL DEFAULT false;

-- Bascule la categorie "Autre" de l'univers "Autre" (cf. prisma/seed.ts).
-- Scope sur l'univers ET la categorie : le slug n'est unique que par univers.
UPDATE "Category" c
SET "isCatchAll" = true
FROM "Universe" u
WHERE c."universeId" = u."id"
  AND u."slug" = 'autre'
  AND c."slug" = 'autre';
