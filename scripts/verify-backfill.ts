/**
 * Verification de bout en bout du rattrapage de leads, contre une vraie base.
 *
 *   pnpm verify:backfill
 *
 * Pourquoi un script et pas un test Vitest : `backfillLeadsForPro` est
 * essentiellement une requete SQL (haversine, jointures catalogue, EXISTS
 * d'idempotence). La mocker reviendrait a tester le mock ; les tests unitaires
 * couvrent les regles pures qu'elle appelle (cf. lib/matching/eligibility.ts),
 * pas la requete elle-meme. Ce script comble ce trou en creant un scenario
 * reel — lead fourre-tout, lead du metier, lead hors palier — puis en
 * nettoyant derriere lui.
 *
 * Garde-fou : refuse de tourner ailleurs que sur la branche Neon `preview`,
 * et s'appuie sur les donnees de demo (`pnpm db:seed:fakes`).
 */
import { PrismaClient } from "@prisma/client";

import { backfillLeadsForPro } from "@/lib/matching/backfill";

const prisma = new PrismaClient();

const TAG = "verif-backfill";
let ok = true;

function check(label: string, actual: unknown, expected: unknown) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  if (!pass) ok = false;
  console.log(
    `${pass ? "OK  " : "FAIL"} ${label} — attendu ${JSON.stringify(expected)}, obtenu ${JSON.stringify(actual)}`,
  );
}

async function main() {
  const host = (process.env.DATABASE_URL ?? "").match(/@([a-z0-9-]+)\./)?.[1];
  console.log(`Cible BDD : ${host}`);
  if (host !== "ep-empty-mountain-al7hxvix") {
    throw new Error("Cible inattendue — ce script ne tourne que sur preview.");
  }

  const pro = await prisma.proProfile.findFirst({
    where: { companyName: "Peinture Namur SRL" },
    select: {
      id: true,
      latitude: true,
      longitude: true,
      autoAccept: true,
      walletBalanceCents: true,
      interventionRadiusKm: true,
      categories: { select: { categoryId: true } },
    },
  });
  if (!pro) throw new Error("Pro de test introuvable");
  console.log(
    `Pro : autoAccept=${pro.autoAccept}, wallet=${pro.walletBalanceCents}, rayon=${pro.interventionRadiusKm}km, ${pro.categories.length} categorie(s)`,
  );

  // Sous-categorie du metier auquel le pro EST abonne.
  const subscribed = await prisma.subCategory.findFirst({
    where: { categoryId: pro.categories[0].categoryId },
    select: { id: true },
  });
  // Sous-categorie fourre-tout, a laquelle il n'est PAS abonne.
  const catchAll = await prisma.subCategory.findFirst({
    where: { category: { isCatchAll: true } },
    select: { id: true, categoryId: true },
  });
  if (!subscribed || !catchAll) throw new Error("Catalogue incomplet");
  check(
    "le pro n'est PAS abonne au fourre-tout",
    pro.categories.some((c) => c.categoryId === catchAll.categoryId),
    false,
  );

  const client = await prisma.user.create({
    data: { email: `${TAG}@example.invalid`, role: "CLIENT" },
    select: { id: true },
  });

  const base = {
    clientId: client.id,
    clientFirstName: "Verif",
    clientLastName: "Backfill",
    clientEmail: `${TAG}@example.invalid`,
    clientPhone: "+32470000000",
    description: TAG,
    urgency: "PLANNED" as const,
    postalCode: "5000",
    city: "Namur",
    status: "PENDING_MATCH" as const,
    currentRadiusKm: 30,
    sharedLeadPriceCentsSnapshot: 2500,
    exclusiveLeadPriceCentsSnapshot: 6250,
    expiresAt: new Date(Date.now() + 72 * 3600 * 1000),
  };

  // L1 : fourre-tout, sur place → doit etre rattrape malgre le non-abonnement.
  // L2 : metier abonne, sur place → doit etre rattrape.
  // L3 : fourre-tout, a ~55km (Liege) → hors palier 30km, ne doit PAS l'etre.
  const [l1, l2, l3] = await Promise.all([
    prisma.lead.create({
      data: {
        ...base,
        subCategoryId: catchAll.id,
        latitude: pro.latitude,
        longitude: pro.longitude,
      },
      select: { id: true },
    }),
    prisma.lead.create({
      data: {
        ...base,
        subCategoryId: subscribed.id,
        latitude: pro.latitude,
        longitude: pro.longitude,
      },
      select: { id: true },
    }),
    prisma.lead.create({
      data: {
        ...base,
        subCategoryId: catchAll.id,
        latitude: 50.6326,
        longitude: 5.5797,
        city: "Liège",
        postalCode: "4000",
      },
      select: { id: true },
    }),
  ]);

  const created = await backfillLeadsForPro({ proProfileId: pro.id });
  check("assignments crees au 1er passage", created, 2);

  const rows = await prisma.leadAssignment.findMany({
    where: { proProfileId: pro.id, leadId: { in: [l1.id, l2.id, l3.id] } },
    select: { leadId: true, status: true, priceCents: true },
  });
  check("lead fourre-tout rattrape", rows.some((r) => r.leadId === l1.id), true);
  check("lead metier abonne rattrape", rows.some((r) => r.leadId === l2.id), true);
  check("lead hors palier ignore", rows.some((r) => r.leadId === l3.id), false);
  check(
    "aucun auto-accept malgre autoAccept=true et wallet plein",
    rows.every((r) => r.status === "PENDING"),
    true,
  );
  check("prix snapshot repris", [...new Set(rows.map((r) => r.priceCents))], [2500]);

  const again = await backfillLeadsForPro({ proProfileId: pro.id });
  check("idempotence : rien recree au 2e passage", again, 0);

  // ── Nettoyage
  await prisma.leadAssignment.deleteMany({
    where: { leadId: { in: [l1.id, l2.id, l3.id] } },
  });
  await prisma.lead.deleteMany({ where: { id: { in: [l1.id, l2.id, l3.id] } } });
  await prisma.user.delete({ where: { id: client.id } });

  const leftovers = await prisma.lead.count({ where: { description: TAG } });
  check("nettoyage complet", leftovers, 0);

  console.log(ok ? "\n=> TOUT PASSE" : "\n=> ECHEC");
  process.exitCode = ok ? 0 : 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
