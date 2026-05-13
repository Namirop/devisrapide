// Script jetable : cree 3 pros de test (VALIDATED / PENDING / SUSPENDED)
// pour permettre les tests manuels Sprint 2b dashboard pro.
//
// Run : DATABASE_URL=... pnpm tsx scripts/seed-test-pros.ts
//
// Idempotent : upsert sur email, donc relancer ne duplique pas.
// Mots de passe : "Test1234" pour les 3 (8 chars + 1 maj + 1 chiffre).

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PASSWORD = "Test1234";
const PLOMBERIE_CATEGORY_ID = "cmou3kyx0000vi8xojc6imal6";

const PROS = [
  {
    email: "pro-valid@devisrapide.test",
    role: "VALIDATED" as const,
    firstName: "Jean",
    lastName: "Validé",
    phone: "+32475111111",
    company: "Plomberie Jean SRL",
    vat: "BE0111111111",
    validationStatus: "VALIDATED" as const,
    validatedAt: new Date(),
    rejectedReason: null,
    withCategory: true,
  },
  {
    email: "pro-pending@devisrapide.test",
    role: "PENDING" as const,
    firstName: "Marc",
    lastName: "En Attente",
    phone: "+32475222222",
    company: "Marc Constructions",
    vat: "BE0222222222",
    validationStatus: "PENDING" as const,
    validatedAt: null,
    rejectedReason: null,
    withCategory: false,
  },
  {
    email: "pro-suspended@devisrapide.test",
    role: "SUSPENDED" as const,
    firstName: "Paul",
    lastName: "Suspendu",
    phone: "+32475333333",
    company: "Paul Toitures",
    vat: "BE0333333333",
    validationStatus: "SUSPENDED" as const,
    validatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    rejectedReason: "Suspendu pour test manuel Sprint 2b.",
    withCategory: false,
  },
];

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 12);

  for (const p of PROS) {
    // Idempotent : upsert user puis ProProfile (upsert sur userId unique).
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone,
        role: "PRO",
        passwordHash: hash,
        deletedAt: null,
      },
      create: {
        email: p.email,
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone,
        role: "PRO",
        passwordHash: hash,
      },
      select: { id: true },
    });

    const profile = await prisma.proProfile.upsert({
      where: { userId: user.id },
      update: {
        companyName: p.company,
        vatNumber: p.vat,
        validationStatus: p.validationStatus,
        validatedAt: p.validatedAt,
        rejectedReason: p.rejectedReason,
        // On reset coords + radius + wallet a chaque run pour avoir un
        // etat reproductible.
        postalCode: "1000",
        city: "Bruxelles",
        latitude: 50.8503,
        longitude: 4.3517,
        interventionRadiusKm: 30,
        walletBalanceCents: 100000,
        autoAccept: false,
      },
      create: {
        userId: user.id,
        companyName: p.company,
        vatNumber: p.vat,
        validationStatus: p.validationStatus,
        validatedAt: p.validatedAt,
        rejectedReason: p.rejectedReason,
        postalCode: "1000",
        city: "Bruxelles",
        latitude: 50.8503,
        longitude: 4.3517,
        interventionRadiusKm: 30,
        walletBalanceCents: 100000,
        autoAccept: false,
      },
      select: { id: true },
    });

    if (p.withCategory) {
      // Inscription a Plomberie pour que le pro VALIDATED voie des
      // leads test (a creer separement via /demande).
      await prisma.proCategory.upsert({
        where: {
          proProfileId_categoryId: {
            proProfileId: profile.id,
            categoryId: PLOMBERIE_CATEGORY_ID,
          },
        },
        update: {},
        create: {
          proProfileId: profile.id,
          categoryId: PLOMBERIE_CATEGORY_ID,
        },
      });
    }

    console.log(`[seed-test-pros] OK ${p.role.padEnd(10)} ${p.email}`);
  }

  console.log(`\nLogin password (3 pros) : ${PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
