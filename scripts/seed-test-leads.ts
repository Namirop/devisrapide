// Script jetable : cree des leads test (PENDING + ACCEPTED varies)
// pour le pro VALIDATED, afin de tester les pages dashboard 2b.
//
// Run : DATABASE_URL=... pnpm tsx scripts/seed-test-leads.ts
//
// Idempotent : supprime d'abord tous les leads + assignments + wallet
// transactions associes au pro VALIDATED, puis recree un set frais.
// Le wallet du pro est reset a 1000€ puis decremente cf. les ACCEPTED.
//
// Pre-requis : avoir run `pnpm tsx scripts/seed-test-pros.ts` avant.

import { PrismaClient, type LeadFollowupStatus } from "@prisma/client";

const prisma = new PrismaClient();

const PRO_EMAIL = "pro-valid@devisrapide.test";

// Coefficients urgence (alignes Sprint 2a computeLeadBasePrice).
const URGENCY_MULTIPLIER = {
  URGENT: 1.3,
  SOON: 1.1,
  PLANNED: 1.0,
  FLEXIBLE: 0.9,
} as const;

type Urgency = keyof typeof URGENCY_MULTIPLIER;

type LeadSpec = {
  // Description naturelle pour reconnaitre le lead dans la UI.
  description: string;
  subSlug: string; // sub-cat slug dans la cat Plomberie
  urgency: Urgency;
  city: string;
  postalCode: string;
  lat: number;
  lng: number;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone: string;
  address: string | null;
  // Si "pending" -> assignment PENDING (acceptable depuis le dashboard).
  // Sinon -> ACCEPTED avec ce followupStatus, et la duree depuis
  // l'acceptation est `acceptedAgoHours`.
  state:
    | { kind: "pending" }
    | { kind: "accepted"; followupStatus: LeadFollowupStatus; acceptedAgoHours: number };
};

const LEADS: LeadSpec[] = [
  // ── 3 PENDING (variation urgence / sub-cat) ─────────────────
  {
    description:
      "Fuite sous évier de cuisine, eau qui s'écoule en continu. Besoin d'une intervention rapide.",
    subSlug: "fuite-depannage",
    urgency: "URGENT",
    city: "Bruxelles",
    postalCode: "1000",
    lat: 50.8503,
    lng: 4.3517,
    clientFirstName: "Alice",
    clientLastName: "Lambert",
    clientEmail: "alice.lambert.test@example.test",
    clientPhone: "+32475100001",
    address: "12 rue de la Loi",
    state: { kind: "pending" },
  },
  {
    description:
      "Pose d'une nouvelle salle de bain : double vasque, douche italienne, mitigeur thermostatique. Devis souhaité.",
    subSlug: "installation-complete",
    urgency: "PLANNED",
    city: "Ixelles",
    postalCode: "1050",
    lat: 50.8275,
    lng: 4.37,
    clientFirstName: "Bruno",
    clientLastName: "Martin",
    clientEmail: "bruno.martin.test@example.test",
    clientPhone: "+32475100002",
    address: "45 chaussée d'Ixelles",
    state: { kind: "pending" },
  },
  {
    description:
      "Canalisation principale bouchée, mauvaises odeurs depuis 2 jours. Refoulement dans le sous-sol.",
    subSlug: "debouchage",
    urgency: "SOON",
    city: "Anderlecht",
    postalCode: "1070",
    lat: 50.8333,
    lng: 4.3,
    clientFirstName: "Claire",
    clientLastName: "Dubois",
    clientEmail: "claire.dubois.test@example.test",
    clientPhone: "+32475100003",
    address: null,
    state: { kind: "pending" },
  },

  // ── 3 ACCEPTED (variation followupStatus + age) ────────────
  {
    description:
      "Remplacement chauffe-eau 200L, ancien modèle hors service. Modèle thermo-dynamique souhaité si possible.",
    subSlug: "installation-complete",
    urgency: "SOON",
    city: "Schaerbeek",
    postalCode: "1030",
    lat: 50.8676,
    lng: 4.3725,
    clientFirstName: "David",
    clientLastName: "Petit",
    clientEmail: "david.petit.test@example.test",
    clientPhone: "+32475100004",
    address: "78 avenue Louis Bertrand",
    state: { kind: "accepted", followupStatus: "PENDING", acceptedAgoHours: 2 },
  },
  {
    description:
      "Réparation petite fuite robinet salle de bain. Intervention faite, client très satisfait, devis signé pour la suite.",
    subSlug: "fuite-depannage",
    urgency: "PLANNED",
    city: "Etterbeek",
    postalCode: "1040",
    lat: 50.836,
    lng: 4.388,
    clientFirstName: "Émilie",
    clientLastName: "Rousseau",
    clientEmail: "emilie.rousseau.test@example.test",
    clientPhone: "+32475100005",
    address: "23 rue Gray",
    state: { kind: "accepted", followupStatus: "CONVERTED", acceptedAgoHours: 36 },
  },
  {
    description:
      "Débouchage WC à l'étage. Tentatives d'appel sans réponse, je n'ai pas réussi à joindre le client.",
    subSlug: "debouchage",
    urgency: "URGENT",
    city: "Saint-Gilles",
    postalCode: "1060",
    lat: 50.829,
    lng: 4.348,
    clientFirstName: "Frédéric",
    clientLastName: "Nguyen",
    clientEmail: "frederic.nguyen.test@example.test",
    clientPhone: "+32475100006",
    address: null,
    state: { kind: "accepted", followupStatus: "NOT_REACHABLE", acceptedAgoHours: 72 },
  },
];

async function main() {
  // ── 1. Resolve le pro VALIDATED + ses ressources ─────────
  const user = await prisma.user.findUnique({
    where: { email: PRO_EMAIL },
    include: { proProfile: { select: { id: true } } },
  });
  if (!user || !user.proProfile) {
    throw new Error(
      `Pro "${PRO_EMAIL}" introuvable. Run d'abord pnpm tsx scripts/seed-test-pros.ts.`,
    );
  }
  const proProfileId = user.proProfile.id;
  const proUserId = user.id;

  const plomberie = await prisma.category.findFirst({
    where: {
      slug: "plomberie",
      universe: { slug: "techniques-energie" },
    },
    include: { subCategories: true },
  });
  if (!plomberie) {
    throw new Error("Catégorie Plomberie introuvable. Run pnpm db:seed avant.");
  }
  const subBySlug = new Map(plomberie.subCategories.map((s) => [s.slug, s]));

  // ── 2. Cleanup : remove existing leads/assignments/tx ────
  // On supprime tout ce qui est lie au proProfileId pour repartir d'un
  // etat reproductible. Les autres pros (PENDING, SUSPENDED) n'ont
  // pas de leads donc rien a casser.
  const oldAssignments = await prisma.leadAssignment.findMany({
    where: { proProfileId },
    select: { id: true, leadId: true },
  });
  const oldLeadIds = Array.from(new Set(oldAssignments.map((a) => a.leadId)));

  await prisma.$transaction([
    prisma.walletTransaction.deleteMany({ where: { userId: proUserId } }),
    prisma.leadAssignment.deleteMany({ where: { proProfileId } }),
    // Les leads ne sont supprimes que s'ils n'ont plus d'assignment.
    prisma.lead.deleteMany({ where: { id: { in: oldLeadIds } } }),
  ]);

  // ── 3. Reset wallet pro a 100000 cents (1000€) ──────────
  await prisma.proProfile.update({
    where: { id: proProfileId },
    data: { walletBalanceCents: 100000, autoAccept: false },
  });

  // ── 4. Pour chaque LeadSpec : create Lead + Assignment ──
  let balance = 100000;
  const now = new Date();
  let createdPending = 0;
  let createdAccepted = 0;

  for (const spec of LEADS) {
    const sub = subBySlug.get(spec.subSlug);
    if (!sub) {
      throw new Error(`Sub-cat plomberie/${spec.subSlug} introuvable.`);
    }

    const shared = sub.sharedLeadPriceCents ?? plomberie.defaultSharedLeadPriceCents;
    const exclusive =
      sub.exclusiveLeadPriceCents ?? plomberie.defaultExclusiveLeadPriceCents;
    const multiplier = URGENCY_MULTIPLIER[spec.urgency];
    const sharedSnap = Math.round(shared * multiplier);
    const exclusiveSnap = Math.round(exclusive * multiplier);

    // Upsert client User (idempotent par email).
    const client = await prisma.user.upsert({
      where: { email: spec.clientEmail },
      update: {
        firstName: spec.clientFirstName,
        lastName: spec.clientLastName,
        phone: spec.clientPhone,
      },
      create: {
        email: spec.clientEmail,
        role: "CLIENT",
        firstName: spec.clientFirstName,
        lastName: spec.clientLastName,
        phone: spec.clientPhone,
      },
      select: { id: true },
    });

    // Create Lead.
    const matchingStartedAt =
      spec.state.kind === "accepted"
        ? new Date(now.getTime() - spec.state.acceptedAgoHours * 60 * 60 * 1000)
        : new Date(now.getTime() - 30 * 60 * 1000); // recent (30min)

    const expiresAt = new Date(
      matchingStartedAt.getTime() + 24 * 60 * 60 * 1000,
    ); // +24h

    const lead = await prisma.lead.create({
      data: {
        status: spec.state.kind === "accepted" ? "ACCEPTED" : "PENDING_MATCH",
        clientId: client.id,
        clientFirstName: spec.clientFirstName,
        clientLastName: spec.clientLastName,
        clientEmail: spec.clientEmail,
        clientPhone: spec.clientPhone,
        subCategoryId: sub.id,
        description: spec.description,
        urgency: spec.urgency,
        postalCode: spec.postalCode,
        city: spec.city,
        address: spec.address,
        latitude: spec.lat,
        longitude: spec.lng,
        isExclusive: false,
        sharedLeadPriceCentsSnapshot: sharedSnap,
        exclusiveLeadPriceCentsSnapshot: exclusiveSnap,
        currentRadiusKm: 30,
        matchingStartedAt,
        matchAttempts: 1,
        createdAt: matchingStartedAt,
        expiresAt,
      },
      select: { id: true },
    });

    if (spec.state.kind === "pending") {
      const assignExpires = new Date(
        matchingStartedAt.getTime() + 2 * 60 * 60 * 1000, // +2h timeout PENDING
      );
      await prisma.leadAssignment.create({
        data: {
          leadId: lead.id,
          proProfileId,
          proUserId,
          status: "PENDING",
          followupStatus: "PENDING",
          isExclusive: false,
          priceCents: sharedSnap,
          radiusKmAtAssignment: 30,
          notifiedAt: matchingStartedAt,
          expiresAt: assignExpires,
        },
      });
      createdPending++;
    } else {
      // ACCEPTED : assignment + WalletTransaction LEAD_DEBIT.
      const acceptedAt = new Date(
        now.getTime() -
          spec.state.acceptedAgoHours * 60 * 60 * 1000 +
          5 * 60 * 1000, // 5min apres matchingStarted
      );
      balance -= sharedSnap;

      const assignment = await prisma.leadAssignment.create({
        data: {
          leadId: lead.id,
          proProfileId,
          proUserId,
          status: "ACCEPTED",
          followupStatus: spec.state.followupStatus,
          isExclusive: false,
          priceCents: sharedSnap,
          radiusKmAtAssignment: 30,
          notifiedAt: matchingStartedAt,
          acceptedAt,
          expiresAt: new Date(
            matchingStartedAt.getTime() + 24 * 60 * 60 * 1000,
          ),
        },
        select: { id: true },
      });

      const tx = await prisma.walletTransaction.create({
        data: {
          userId: proUserId,
          type: "LEAD_DEBIT",
          amountCents: sharedSnap,
          balanceAfterCents: balance,
          leadAssignmentId: assignment.id,
          description: "Acceptation lead",
          createdAt: acceptedAt,
        },
        select: { id: true },
      });
      await prisma.leadAssignment.update({
        where: { id: assignment.id },
        data: { walletTransactionId: tx.id },
      });

      createdAccepted++;
    }
  }

  // ── 5. Sync wallet du pro au solde final ────────────────
  await prisma.proProfile.update({
    where: { id: proProfileId },
    data: { walletBalanceCents: balance, lastLeadReceivedAt: now },
  });

  console.log(
    `[seed-test-leads] OK ${createdPending} PENDING + ${createdAccepted} ACCEPTED`,
  );
  console.log(
    `Wallet pro VALIDATED : ${(balance / 100).toFixed(2).replace(".", ",")} €`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
