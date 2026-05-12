import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── CATALOGUE ─────────────────────────────────────────────
// Prix en centimes. Provisoires - a valider avec Kamel.

type SubSeed = { name: string; slug: string };

type CategorySeed = {
  name: string;
  slug: string;
  defaultSharedLeadPriceCents: number;
  defaultExclusiveLeadPriceCents: number;
  subCategories: SubSeed[];
};

type UniverseSeed = {
  name: string;
  slug: string;
  description?: string;
  iconName?: string;
  categories: CategorySeed[];
};

// Catalogue BE Phase 4 : 2 univers (Travaux planifiables + SOS Depannage 24/7).
// SOS Depannage = 1 categorie wrapper "urgences" avec 6 sous-cats d'urgence
// directe (le modele Prisma impose 3 niveaux, on garde une cat unique pour
// SOS et le wizard la sautera cote UI au Sprint 2).
const CATALOGUE: UniverseSeed[] = [
  {
    name: "Travaux",
    slug: "travaux",
    iconName: "hammer",
    categories: [
      {
        name: "Toiture",
        slug: "toiture",
        defaultSharedLeadPriceCents: 3500,
        defaultExclusiveLeadPriceCents: 8750,
        subCategories: [
          { name: "Rénovation complète", slug: "renovation-complete" },
          { name: "Isolation", slug: "isolation" },
          { name: "Zinguerie", slug: "zinguerie" },
          { name: "Étanchéité", slug: "etancheite" },
          { name: "Velux & lucarnes", slug: "velux-lucarnes" },
        ],
      },
      {
        name: "Plomberie",
        slug: "plomberie",
        defaultSharedLeadPriceCents: 2500,
        defaultExclusiveLeadPriceCents: 6250,
        subCategories: [
          { name: "Fuite & dépannage", slug: "fuite-depannage" },
          { name: "Chauffe-eau", slug: "chauffe-eau" },
          { name: "Robinetterie", slug: "robinetterie" },
          { name: "Salle de bain", slug: "salle-de-bain" },
        ],
      },
      {
        name: "Électricité",
        slug: "electricite",
        defaultSharedLeadPriceCents: 2500,
        defaultExclusiveLeadPriceCents: 6250,
        subCategories: [
          { name: "Installation neuve", slug: "installation-neuve" },
          { name: "Rénovation tableau", slug: "renovation-tableau" },
          { name: "Domotique", slug: "domotique" },
          { name: "Mise aux normes", slug: "mise-aux-normes" },
        ],
      },
      {
        name: "Chauffage",
        slug: "chauffage",
        defaultSharedLeadPriceCents: 2500,
        defaultExclusiveLeadPriceCents: 6250,
        subCategories: [
          { name: "Chaudière gaz/mazout", slug: "chaudiere-gaz-mazout" },
          { name: "Pompe à chaleur", slug: "pompe-a-chaleur" },
          { name: "Entretien annuel", slug: "entretien-annuel" },
          { name: "Radiateurs", slug: "radiateurs" },
        ],
      },
      {
        name: "Peinture",
        slug: "peinture",
        defaultSharedLeadPriceCents: 2000,
        defaultExclusiveLeadPriceCents: 5000,
        subCategories: [
          { name: "Intérieur", slug: "interieur" },
          { name: "Façade", slug: "facade" },
          { name: "Décoration", slug: "decoration" },
          { name: "Préparation murs", slug: "preparation-murs" },
        ],
      },
      {
        name: "Menuiserie",
        slug: "menuiserie",
        defaultSharedLeadPriceCents: 2500,
        defaultExclusiveLeadPriceCents: 6250,
        subCategories: [
          { name: "Châssis & fenêtres", slug: "chassis-fenetres" },
          { name: "Portes", slug: "portes" },
          { name: "Sur-mesure", slug: "sur-mesure" },
          { name: "Parquet", slug: "parquet" },
        ],
      },
      {
        name: "Maçonnerie",
        slug: "maconnerie",
        defaultSharedLeadPriceCents: 3500,
        defaultExclusiveLeadPriceCents: 8750,
        subCategories: [
          { name: "Construction neuve", slug: "construction-neuve" },
          { name: "Extension", slug: "extension" },
          { name: "Façade", slug: "facade" },
          { name: "Mur de soutènement", slug: "mur-soutenement" },
        ],
      },
      {
        name: "Carrelage",
        slug: "carrelage",
        defaultSharedLeadPriceCents: 2000,
        defaultExclusiveLeadPriceCents: 5000,
        subCategories: [
          { name: "Sol intérieur", slug: "sol-interieur" },
          { name: "Salle de bain", slug: "salle-de-bain" },
          { name: "Cuisine", slug: "cuisine" },
          { name: "Extérieur", slug: "exterieur" },
        ],
      },
    ],
  },
  {
    name: "SOS Dépannage",
    slug: "sos-depannage",
    iconName: "alert-circle",
    categories: [
      {
        // Categorie wrapper unique (le modele Prisma impose 3 niveaux).
        // Le wizard sautera ce niveau intermediaire cote UI Sprint 2.
        name: "Urgences",
        slug: "urgences",
        defaultSharedLeadPriceCents: 3000,
        defaultExclusiveLeadPriceCents: 7500,
        subCategories: [
          { name: "Fuite urgente", slug: "fuite-urgente" },
          { name: "Coupure électricité", slug: "coupure-electricite" },
          { name: "Chauffage en panne", slug: "chauffage-en-panne" },
          { name: "Serrurerie 24/7", slug: "serrurerie-247" },
          { name: "Sanitaire bouché", slug: "sanitaire-bouche" },
          { name: "Autre urgence", slug: "autre-urgence" },
        ],
      },
    ],
  },
];

// ─── APP CONFIG ────────────────────────────────────────────

const APP_CONFIG: Array<Omit<Prisma.AppConfigCreateInput, "updatedAt">> = [
  {
    key: "RADIUS_PALIERS_KM",
    value: "[25,50,100]",
    valueType: "json",
    description: "Paliers d'élargissement du rayon de matching (km).",
  },
  {
    key: "RESPONSE_DELAY_MINUTES",
    value: "120",
    valueType: "int",
    description: "Délai par défaut accordé au pro pour accepter un lead.",
  },
  {
    key: "LEAD_GLOBAL_TIMEOUT_HOURS",
    value: "24",
    valueType: "int",
    description: "Délai global avant expiration définitive d'un lead.",
  },
  {
    key: "MAX_PROS_PER_SHARED_LEAD",
    value: "3",
    valueType: "int",
    description: "Nombre maximum de pros notifiés sur un lead partagé.",
  },
  {
    key: "EXCLUSIVE_PRICE_MULTIPLIER_DEFAULT",
    value: "2.0",
    valueType: "float",
    description: "Multiplicateur appliqué au prix partagé pour le mode exclusif.",
  },
];

async function seedCatalogue() {
  for (let u = 0; u < CATALOGUE.length; u++) {
    const universeSeed = CATALOGUE[u];
    const universe = await prisma.universe.upsert({
      where: { slug: universeSeed.slug },
      update: {
        name: universeSeed.name,
        iconName: universeSeed.iconName,
        displayOrder: u,
      },
      create: {
        name: universeSeed.name,
        slug: universeSeed.slug,
        iconName: universeSeed.iconName,
        displayOrder: u,
      },
    });

    for (let c = 0; c < universeSeed.categories.length; c++) {
      const catSeed = universeSeed.categories[c];
      const category = await prisma.category.upsert({
        where: {
          universeId_slug: {
            universeId: universe.id,
            slug: catSeed.slug,
          },
        },
        update: {
          name: catSeed.name,
          defaultSharedLeadPriceCents: catSeed.defaultSharedLeadPriceCents,
          defaultExclusiveLeadPriceCents:
            catSeed.defaultExclusiveLeadPriceCents,
          displayOrder: c,
        },
        create: {
          universeId: universe.id,
          name: catSeed.name,
          slug: catSeed.slug,
          defaultSharedLeadPriceCents: catSeed.defaultSharedLeadPriceCents,
          defaultExclusiveLeadPriceCents:
            catSeed.defaultExclusiveLeadPriceCents,
          displayOrder: c,
        },
      });

      for (let s = 0; s < catSeed.subCategories.length; s++) {
        const sub = catSeed.subCategories[s];
        await prisma.subCategory.upsert({
          where: {
            categoryId_slug: {
              categoryId: category.id,
              slug: sub.slug,
            },
          },
          update: { name: sub.name, displayOrder: s },
          create: {
            categoryId: category.id,
            name: sub.name,
            slug: sub.slug,
            displayOrder: s,
          },
        });
      }
    }
  }
}

async function seedAppConfig() {
  for (const entry of APP_CONFIG) {
    await prisma.appConfig.upsert({
      where: { key: entry.key },
      update: {
        value: entry.value,
        valueType: entry.valueType,
        description: entry.description,
      },
      create: entry,
    });
  }
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!email || !password) {
    console.warn(
      "[seed] ADMIN_EMAIL / ADMIN_INITIAL_PASSWORD manquants - admin non seedé.",
    );
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: {
      email,
      role: "ADMIN",
      firstName: "Kamel",
      passwordHash,
    },
  });
}

async function main() {
  await seedCatalogue();
  await seedAppConfig();
  await seedAdmin();
  const counts = {
    universes: await prisma.universe.count(),
    categories: await prisma.category.count(),
    subCategories: await prisma.subCategory.count(),
    appConfig: await prisma.appConfig.count(),
    admins: await prisma.user.count({ where: { role: "ADMIN" } }),
  };
  console.log("[seed] OK", counts);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
