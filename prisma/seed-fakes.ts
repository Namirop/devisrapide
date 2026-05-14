import { type PrismaClient, type AssignmentStatus, type LeadFollowupStatus, type LeadStatus, type LeadUrgency, type ProValidationStatus, type WalletTxType } from "@prisma/client";
import bcrypt from "bcryptjs";

// Seeding "fakes" : users + leads + assignments + wallet txs + audit logs.
// Active uniquement quand SEED_FAKES=true. Idempotent : tous les fakes sont
// identifies par emails / VAT en `.test@example.test` ou `BE0XXX...` et
// sont purges au debut puis recrees.

const FAKE_EMAIL_SUFFIX = ".test@example.test";

const BE = {
  BRUXELLES: { postalCode: "1000", city: "Bruxelles", lat: 50.8466, lng: 4.3528 },
  LIEGE: { postalCode: "4000", city: "Liège", lat: 50.6326, lng: 5.5797 },
  CHARLEROI: { postalCode: "6000", city: "Charleroi", lat: 50.4108, lng: 4.4446 },
  NAMUR: { postalCode: "5000", city: "Namur", lat: 50.4674, lng: 4.8718 },
  GAND: { postalCode: "9000", city: "Gand", lat: 51.0543, lng: 3.7174 },
  MONS: { postalCode: "7000", city: "Mons", lat: 50.4542, lng: 3.9514 },
  BXL_IXL: { postalCode: "1050", city: "Ixelles", lat: 50.8267, lng: 4.3650 },
} as const;

type ProSeed = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyName: string;
  vatNumber: string;
  description: string;
  city: keyof typeof BE;
  categorySlugs: string[]; // slugs Category (multi-cat possible)
  validationStatus: ProValidationStatus;
  rejectedReason?: string;
  suspensionReason?: string;
  walletBalanceCents: number;
  autoAccept: boolean;
};

const PROS: ProSeed[] = [
  {
    email: "pro1.pending" + FAKE_EMAIL_SUFFIX,
    firstName: "Pierre",
    lastName: "Janssens",
    phone: "+32470010101",
    companyName: "Toiture Pro Bruxelles SPRL",
    vatNumber: "BE0123456789",
    description: "Specialiste toiture et zinguerie depuis 2010. Equipe de 4 couvreurs.",
    city: "BRUXELLES",
    categorySlugs: ["toiture"],
    validationStatus: "PENDING",
    walletBalanceCents: 100000,
    autoAccept: false,
  },
  {
    email: "pro2.elec" + FAKE_EMAIL_SUFFIX,
    firstName: "Jean",
    lastName: "Dupont",
    phone: "+32470020202",
    companyName: "Electricite Liegeoise SA",
    vatNumber: "BE0234567891",
    description: "Electricien agree pour mise en conformite et installation neuve.",
    city: "LIEGE",
    categorySlugs: ["electricite"],
    validationStatus: "VALIDATED",
    walletBalanceCents: 95000,
    autoAccept: false,
  },
  {
    email: "pro3.plomb" + FAKE_EMAIL_SUFFIX,
    firstName: "Marc",
    lastName: "Verhoeven",
    phone: "+32470030303",
    companyName: "Plomberie Express Charleroi",
    vatNumber: "BE0345678912",
    description: "Intervention rapide sur fuites et debouchage. 24/7.",
    city: "CHARLEROI",
    categorySlugs: ["plomberie"],
    validationStatus: "VALIDATED",
    walletBalanceCents: 0,
    autoAccept: false,
  },
  {
    email: "pro4.peinture" + FAKE_EMAIL_SUFFIX,
    firstName: "Antoine",
    lastName: "Leroy",
    phone: "+32470040404",
    companyName: "Peinture Namur SRL",
    vatNumber: "BE0456789123",
    description: "Peinture interieure et exterieure, projets clefs en main.",
    city: "NAMUR",
    categorySlugs: ["peinture"],
    validationStatus: "VALIDATED",
    walletBalanceCents: 50000,
    autoAccept: true,
  },
  {
    email: "pro5.chauffage" + FAKE_EMAIL_SUFFIX,
    firstName: "David",
    lastName: "Smets",
    phone: "+32470050505",
    companyName: "Chauffage & Energie Gand",
    vatNumber: "BE0567891234",
    description: "Chaudieres, pompes a chaleur, entretien annuel.",
    city: "GAND",
    categorySlugs: ["chauffage"],
    validationStatus: "VALIDATED",
    walletBalanceCents: 77500,
    autoAccept: false,
  },
  {
    email: "pro6.multi" + FAKE_EMAIL_SUFFIX,
    firstName: "Eric",
    lastName: "Lambert",
    phone: "+32470060606",
    companyName: "MultiService Mons SCS",
    vatNumber: "BE0678912345",
    description: "Serrurerie d'urgence et debouchage canalisations.",
    city: "MONS",
    categorySlugs: ["serrurerie", "debouchage-vidange"],
    validationStatus: "VALIDATED",
    walletBalanceCents: 30000,
    autoAccept: false,
  },
  {
    email: "pro7.rejected" + FAKE_EMAIL_SUFFIX,
    firstName: "Bernard",
    lastName: "Sketchy",
    phone: "+32470070707",
    companyName: "Sketchy Toiture SPRL",
    vatNumber: "BE0789123456",
    description: "Dossier incomplet a la candidature.",
    city: "BXL_IXL",
    categorySlugs: ["toiture"],
    validationStatus: "REJECTED",
    rejectedReason: "Numero de TVA non verifiable et absence d'attestation d'assurance professionnelle.",
    walletBalanceCents: 0,
    autoAccept: false,
  },
  {
    email: "pro8.suspended" + FAKE_EMAIL_SUFFIX,
    firstName: "Frank",
    lastName: "Wauters",
    phone: "+32470080808",
    companyName: "Suspendu Elec SA",
    vatNumber: "BE0891234567",
    description: "Suspendu suite a plaintes clients.",
    city: "LIEGE",
    categorySlugs: ["electricite"],
    validationStatus: "SUSPENDED",
    suspensionReason: "Multiples plaintes clients pour devis non honores - dossier en cours d'analyse.",
    walletBalanceCents: 0,
    autoAccept: false,
  },
];

type ClientSeed = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
};

const CLIENTS: ClientSeed[] = [
  { email: "marie.lambert" + FAKE_EMAIL_SUFFIX, firstName: "Marie", lastName: "Lambert", phone: "+32471111111" },
  { email: "thomas.dubois" + FAKE_EMAIL_SUFFIX, firstName: "Thomas", lastName: "Dubois", phone: "+32472222222" },
  { email: "sophie.martin" + FAKE_EMAIL_SUFFIX, firstName: "Sophie", lastName: "Martin", phone: "+32473333333" },
  { email: "lucas.petit" + FAKE_EMAIL_SUFFIX, firstName: "Lucas", lastName: "Petit", phone: "+32474444444" },
  { email: "julie.moreau" + FAKE_EMAIL_SUFFIX, firstName: "Julie", lastName: "Moreau", phone: "+32475555555" },
];

type LeadSeed = {
  ref: string; // identifiant interne pour referencer dans assignments
  clientEmail: string;
  categorySlug: string;
  subCategorySlug: string;
  city: keyof typeof BE;
  status: LeadStatus;
  urgency: LeadUrgency;
  description: string;
  isExclusive: boolean;
  daysAgo: number; // age du lead en jours
};

const LEADS: LeadSeed[] = [
  { ref: "L1", clientEmail: CLIENTS[0].email, categorySlug: "toiture", subCategorySlug: "installation-complete", city: "BRUXELLES", status: "PENDING_MATCH", urgency: "URGENT", description: "Toiture a refaire integralement, environ 80m2, ardoises naturelles.", isExclusive: false, daysAgo: 0 },
  { ref: "L2", clientEmail: CLIENTS[1].email, categorySlug: "electricite", subCategorySlug: "mise-en-conformite", city: "LIEGE", status: "PENDING_MATCH", urgency: "SOON", description: "Mise en conformite tableau electrique maison annee 1970.", isExclusive: false, daysAgo: 0 },
  { ref: "L3", clientEmail: CLIENTS[2].email, categorySlug: "plomberie", subCategorySlug: "fuite-depannage", city: "CHARLEROI", status: "ASSIGNED", urgency: "URGENT", description: "Fuite sous evier cuisine, eau qui suinte depuis ce matin.", isExclusive: false, daysAgo: 0 },
  { ref: "L4", clientEmail: CLIENTS[3].email, categorySlug: "peinture", subCategorySlug: "projet-complet", city: "NAMUR", status: "ASSIGNED", urgency: "PLANNED", description: "Repeindre salon + cuisine + couloir, environ 60m2.", isExclusive: false, daysAgo: 1 },
  { ref: "L5", clientEmail: CLIENTS[4].email, categorySlug: "chauffage", subCategorySlug: "nouvelle-installation", city: "GAND", status: "ACCEPTED", urgency: "SOON", description: "Remplacer chaudiere gaz par pompe a chaleur air-eau.", isExclusive: false, daysAgo: 2 },
  { ref: "L6", clientEmail: CLIENTS[0].email, categorySlug: "serrurerie", subCategorySlug: "ouverture-porte", city: "MONS", status: "ACCEPTED", urgency: "URGENT", description: "Porte d'entree claquee, cle a l'interieur. Besoin d'ouverture urgente.", isExclusive: false, daysAgo: 1 },
  { ref: "L7", clientEmail: CLIENTS[1].email, categorySlug: "electricite", subCategorySlug: "nouvelle-installation", city: "LIEGE", status: "COMPLETED", urgency: "FLEXIBLE", description: "Installation electrique complete pour extension 30m2.", isExclusive: false, daysAgo: 14 },
  { ref: "L8", clientEmail: CLIENTS[2].email, categorySlug: "electricite", subCategorySlug: "depannage-urgent", city: "BXL_IXL", status: "COMPLETED", urgency: "SOON", description: "Panne generale, plus de courant dans tout l'appartement.", isExclusive: false, daysAgo: 21 },
  { ref: "L9", clientEmail: CLIENTS[3].email, categorySlug: "plomberie", subCategorySlug: "debouchage", city: "CHARLEROI", status: "EXPIRED", urgency: "URGENT", description: "WC bouches.", isExclusive: false, daysAgo: 5 },
  { ref: "L10", clientEmail: CLIENTS[4].email, categorySlug: "chauffage", subCategorySlug: "entretien-annuel", city: "GAND", status: "CANCELLED", urgency: "PLANNED", description: "Entretien annuel chaudiere - client a finalement trouve via voisin.", isExclusive: false, daysAgo: 3 },
  { ref: "L11", clientEmail: CLIENTS[0].email, categorySlug: "serrurerie", subCategorySlug: "remplacement-serrure", city: "MONS", status: "ASSIGNED", urgency: "URGENT", description: "Remplacement serrure 3 points apres effraction.", isExclusive: true, daysAgo: 0 },
  { ref: "L12", clientEmail: CLIENTS[1].email, categorySlug: "renovation-interieure", subCategorySlug: "transformation-complete", city: "NAMUR", status: "PENDING_MATCH", urgency: "FLEXIBLE", description: "Renovation complete maison 4 facades, environ 150m2.", isExclusive: false, daysAgo: 1 },
];

type AssignmentSeed = {
  leadRef: string;
  proEmail: string;
  status: AssignmentStatus;
  isExclusive: boolean;
  adminGifted: boolean;
  followupStatus: LeadFollowupStatus;
  refusalReason?: string;
};

const ASSIGNMENTS: AssignmentSeed[] = [
  { leadRef: "L3", proEmail: PROS[2].email, status: "PENDING", isExclusive: false, adminGifted: false, followupStatus: "PENDING" },
  { leadRef: "L4", proEmail: PROS[3].email, status: "PENDING", isExclusive: false, adminGifted: false, followupStatus: "PENDING" },
  { leadRef: "L5", proEmail: PROS[4].email, status: "ACCEPTED", isExclusive: false, adminGifted: false, followupStatus: "PENDING" },
  { leadRef: "L6", proEmail: PROS[5].email, status: "ACCEPTED", isExclusive: false, adminGifted: true, followupStatus: "PENDING" },
  { leadRef: "L7", proEmail: PROS[1].email, status: "ACCEPTED", isExclusive: false, adminGifted: false, followupStatus: "CONVERTED" },
  { leadRef: "L8", proEmail: PROS[1].email, status: "ACCEPTED", isExclusive: false, adminGifted: false, followupStatus: "CONVERTED" },
  { leadRef: "L9", proEmail: PROS[2].email, status: "EXPIRED", isExclusive: false, adminGifted: false, followupStatus: "PENDING" },
  { leadRef: "L5", proEmail: PROS[1].email, status: "REFUSED", isExclusive: false, adminGifted: false, followupStatus: "PENDING", refusalReason: "Hors zone d'intervention" },
  { leadRef: "L11", proEmail: PROS[5].email, status: "PENDING", isExclusive: true, adminGifted: false, followupStatus: "PENDING" },
];

// Transactions wallet en plus des LEAD_DEBIT generes automatiquement
// depuis les assignments ACCEPTED non-gifted ci-dessus.
type StandaloneTxSeed = {
  proEmail: string;
  type: WalletTxType;
  amountCents: number; // positif pour credit, negatif pour debit
  description: string;
  reason?: string;
  daysAgo: number;
};

const STANDALONE_TXS: StandaloneTxSeed[] = [
  { proEmail: PROS[1].email, type: "TOPUP", amountCents: 100000, description: "Recharge Stripe pack Boost", daysAgo: 30 },
  { proEmail: PROS[2].email, type: "ADMIN_CREDIT", amountCents: 20000, description: "Credit gratuit bienvenue", reason: "Geste commercial onboarding", daysAgo: 20 },
  { proEmail: PROS[2].email, type: "ADMIN_DEBIT", amountCents: -20000, description: "Correction credit accidentel", reason: "Annulation geste commercial (double credit)", daysAgo: 18 },
  { proEmail: PROS[3].email, type: "TOPUP", amountCents: 50000, description: "Recharge Stripe pack Decouverte", daysAgo: 15 },
  { proEmail: PROS[4].email, type: "TOPUP", amountCents: 50000, description: "Recharge Stripe pack Decouverte", daysAgo: 25 },
  { proEmail: PROS[4].email, type: "TOPUP", amountCents: 30000, description: "Recharge Stripe complementaire", daysAgo: 10 },
  { proEmail: PROS[5].email, type: "TOPUP", amountCents: 30000, description: "Recharge Stripe pack Decouverte", daysAgo: 12 },
];

async function clearFakes(prisma: PrismaClient) {
  await prisma.auditLog.deleteMany({});
  await prisma.walletTransaction.deleteMany({
    where: { user: { email: { endsWith: FAKE_EMAIL_SUFFIX } } },
  });
  await prisma.leadAssignment.deleteMany({
    where: { proUser: { email: { endsWith: FAKE_EMAIL_SUFFIX } } },
  });
  await prisma.lead.deleteMany({
    where: { clientEmail: { endsWith: FAKE_EMAIL_SUFFIX } },
  });
  // ProProfile + ProCategory cascade via User
  await prisma.user.deleteMany({
    where: { email: { endsWith: FAKE_EMAIL_SUFFIX } },
  });
}

export async function seedFakes(prisma: PrismaClient) {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    throw new Error("[seed-fakes] admin requis - lance seedAdmin() avant.");
  }

  await clearFakes(prisma);

  // ── Resolution catalogue (slug -> id) ─────────────────────
  const categories = await prisma.category.findMany({
    include: { subCategories: true },
  });
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));
  const subBySlug = new Map(
    categories.flatMap((c) =>
      c.subCategories.map((s) => [`${c.slug}/${s.slug}`, s] as const),
    ),
  );

  // ── CLIENTS ────────────────────────────────────────────────
  const clientUsers = new Map<string, string>(); // email -> userId
  for (const c of CLIENTS) {
    const u = await prisma.user.create({
      data: {
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        role: "CLIENT",
      },
    });
    clientUsers.set(c.email, u.id);
  }

  // ── PROS ───────────────────────────────────────────────────
  const proUsers = new Map<string, { userId: string; profileId: string }>();
  const dummyHash = await bcrypt.hash("password-test-only", 12);
  for (const p of PROS) {
    const city = BE[p.city];
    const u = await prisma.user.create({
      data: {
        email: p.email,
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone,
        role: "PRO",
        passwordHash: dummyHash,
      },
    });
    const profile = await prisma.proProfile.create({
      data: {
        userId: u.id,
        companyName: p.companyName,
        vatNumber: p.vatNumber,
        description: p.description,
        postalCode: city.postalCode,
        city: city.city,
        latitude: city.lat,
        longitude: city.lng,
        validationStatus: p.validationStatus,
        validatedAt: p.validationStatus === "VALIDATED" ? new Date(Date.now() - 30 * 86_400_000) : null,
        rejectedReason: p.rejectedReason,
        suspensionReason: p.suspensionReason,
        walletBalanceCents: p.walletBalanceCents,
        autoAccept: p.autoAccept,
      },
    });
    for (const slug of p.categorySlugs) {
      const cat = catBySlug.get(slug);
      if (!cat) throw new Error(`[seed-fakes] category slug introuvable: ${slug}`);
      await prisma.proCategory.create({
        data: { proProfileId: profile.id, categoryId: cat.id },
      });
    }
    proUsers.set(p.email, { userId: u.id, profileId: profile.id });
  }

  // ── LEADS ──────────────────────────────────────────────────
  const leadByRef = new Map<string, { id: string; sharedPriceCents: number; exclusivePriceCents: number }>();
  for (const l of LEADS) {
    const cat = catBySlug.get(l.categorySlug);
    if (!cat) throw new Error(`[seed-fakes] category slug introuvable: ${l.categorySlug}`);
    const sub = subBySlug.get(`${l.categorySlug}/${l.subCategorySlug}`);
    if (!sub) throw new Error(`[seed-fakes] sub-category slug introuvable: ${l.categorySlug}/${l.subCategorySlug}`);
    const client = CLIENTS.find((c) => c.email === l.clientEmail);
    if (!client) throw new Error(`[seed-fakes] client introuvable: ${l.clientEmail}`);
    const clientId = clientUsers.get(l.clientEmail);
    if (!clientId) throw new Error(`[seed-fakes] client user id introuvable`);
    const city = BE[l.city];
    const createdAt = new Date(Date.now() - l.daysAgo * 86_400_000);
    const lead = await prisma.lead.create({
      data: {
        clientId,
        clientFirstName: client.firstName,
        clientLastName: client.lastName,
        clientEmail: client.email,
        clientPhone: client.phone,
        subCategoryId: sub.id,
        description: l.description,
        urgency: l.urgency,
        postalCode: city.postalCode,
        city: city.city,
        latitude: city.lat,
        longitude: city.lng,
        isExclusive: l.isExclusive,
        sharedLeadPriceCentsSnapshot: sub.sharedLeadPriceCents ?? cat.defaultSharedLeadPriceCents,
        exclusiveLeadPriceCentsSnapshot: sub.exclusiveLeadPriceCents ?? cat.defaultExclusiveLeadPriceCents,
        status: l.status,
        createdAt,
        matchingStartedAt: l.status === "PENDING_MATCH" ? null : createdAt,
        expiresAt: l.status === "EXPIRED" || l.status === "CANCELLED"
          ? new Date(createdAt.getTime() + 24 * 3_600_000)
          : new Date(createdAt.getTime() + 24 * 3_600_000),
      },
    });
    leadByRef.set(l.ref, {
      id: lead.id,
      sharedPriceCents: sub.sharedLeadPriceCents ?? cat.defaultSharedLeadPriceCents,
      exclusivePriceCents: sub.exclusiveLeadPriceCents ?? cat.defaultExclusiveLeadPriceCents,
    });
  }

  // ── ASSIGNMENTS (+ wallet txs LEAD_DEBIT lies) ─────────────
  for (const a of ASSIGNMENTS) {
    const lead = leadByRef.get(a.leadRef);
    if (!lead) throw new Error(`[seed-fakes] lead ref introuvable: ${a.leadRef}`);
    const pro = proUsers.get(a.proEmail);
    if (!pro) throw new Error(`[seed-fakes] pro email introuvable: ${a.proEmail}`);
    const priceCents = a.adminGifted ? 0 : (a.isExclusive ? lead.exclusivePriceCents : lead.sharedPriceCents);
    const acceptedAt = a.status === "ACCEPTED" ? new Date(Date.now() - 86_400_000) : null;
    const refusedAt = a.status === "REFUSED" ? new Date(Date.now() - 86_400_000) : null;

    let walletTxId: string | null = null;
    if (a.status === "ACCEPTED" && !a.adminGifted) {
      const tx = await prisma.walletTransaction.create({
        data: {
          userId: pro.userId,
          type: "LEAD_DEBIT",
          amountCents: -priceCents,
          // balanceAfterCents : valeur indicative cote seed (l'historique
          // d'un vrai parcours ne sera pas reconstruit a la volee).
          balanceAfterCents: 0,
          description: `Debit acceptation lead ${a.leadRef}`,
          createdAt: acceptedAt ?? new Date(),
        },
      });
      walletTxId = tx.id;
    }

    await prisma.leadAssignment.create({
      data: {
        leadId: lead.id,
        proProfileId: pro.profileId,
        proUserId: pro.userId,
        status: a.status,
        followupStatus: a.followupStatus,
        isExclusive: a.isExclusive,
        priceCents,
        radiusKmAtAssignment: 30,
        acceptedAt,
        refusedAt,
        refusalReason: a.refusalReason,
        expiresAt: new Date(Date.now() + 2 * 3_600_000),
        adminGifted: a.adminGifted,
        adminGiftedBy: a.adminGifted ? admin.id : null,
        walletTransactionId: walletTxId,
      },
    });
  }

  // ── STANDALONE WALLET TXs ──────────────────────────────────
  for (const t of STANDALONE_TXS) {
    const pro = proUsers.get(t.proEmail);
    if (!pro) throw new Error(`[seed-fakes] pro email introuvable: ${t.proEmail}`);
    await prisma.walletTransaction.create({
      data: {
        userId: pro.userId,
        type: t.type,
        amountCents: t.amountCents,
        balanceAfterCents: 0,
        description: t.description,
        adminReason: t.reason,
        adminActorId: t.type === "ADMIN_CREDIT" || t.type === "ADMIN_DEBIT" ? admin.id : null,
        createdAt: new Date(Date.now() - t.daysAgo * 86_400_000),
      },
    });
  }

  // ── AUDIT LOG (actions admin) ──────────────────────────────
  const auditEntries = [
    { action: "PRO_VALIDATED" as const, targetEmail: PROS[1].email, metadata: { companyName: PROS[1].companyName } },
    { action: "PRO_VALIDATED" as const, targetEmail: PROS[4].email, metadata: { companyName: PROS[4].companyName } },
    { action: "PRO_REJECTED" as const, targetEmail: PROS[6].email, metadata: { reason: PROS[6].rejectedReason } },
    { action: "PRO_SUSPENDED" as const, targetEmail: PROS[7].email, metadata: { reason: PROS[7].suspensionReason } },
    { action: "WALLET_CREDIT_ADDED" as const, targetEmail: PROS[2].email, metadata: { amountCents: 20000, reason: "Geste commercial onboarding" } },
    { action: "WALLET_DEBIT_ADDED" as const, targetEmail: PROS[2].email, metadata: { amountCents: 20000, reason: "Annulation geste commercial (double credit)" } },
  ];
  for (const e of auditEntries) {
    const target = proUsers.get(e.targetEmail);
    if (!target) continue;
    await prisma.auditLog.create({
      data: {
        action: e.action,
        actorId: admin.id,
        targetType: "ProProfile",
        targetId: target.profileId,
        metadata: e.metadata,
      },
    });
  }

  const counts = {
    clients: CLIENTS.length,
    pros: PROS.length,
    leads: LEADS.length,
    assignments: ASSIGNMENTS.length,
    standaloneTxs: STANDALONE_TXS.length,
    auditLogs: auditEntries.length,
  };
  console.log("[seed] fakes OK", counts);
}
