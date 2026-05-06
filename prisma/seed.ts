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

const CATALOGUE: UniverseSeed[] = [
  {
    name: "Gros œuvre & Toiture",
    slug: "gros-oeuvre-toiture",
    iconName: "home",
    categories: [
      {
        name: "Maçonnerie",
        slug: "maconnerie",
        defaultSharedLeadPriceCents: 3500,
        defaultExclusiveLeadPriceCents: 7000,
        subCategories: [
          { name: "Nouvelle construction", slug: "nouvelle-construction" },
          { name: "Rénovation / extension", slug: "renovation-extension" },
          { name: "Fissures et reprise en sous-œuvre", slug: "fissures" },
        ],
      },
      {
        name: "Toiture & Couverture",
        slug: "toiture-couverture",
        defaultSharedLeadPriceCents: 3500,
        defaultExclusiveLeadPriceCents: 7500,
        subCategories: [
          { name: "Nouvelle toiture", slug: "nouvelle-toiture" },
          { name: "Réfection complète", slug: "refection-complete" },
          { name: "Fuite / urgence", slug: "fuite-urgence" },
        ],
      },
      {
        name: "Charpente",
        slug: "charpente",
        defaultSharedLeadPriceCents: 3000,
        defaultExclusiveLeadPriceCents: 6000,
        subCategories: [
          { name: "Charpente neuve", slug: "charpente-neuve" },
          { name: "Traitement / rénovation", slug: "traitement-renovation" },
        ],
      },
      {
        name: "Façade",
        slug: "facade",
        defaultSharedLeadPriceCents: 2500,
        defaultExclusiveLeadPriceCents: 5500,
        subCategories: [
          { name: "Ravalement", slug: "ravalement" },
          { name: "Isolation thermique extérieure", slug: "ite" },
        ],
      },
    ],
  },
  {
    name: "Techniques & Énergie",
    slug: "techniques-energie",
    iconName: "zap",
    categories: [
      {
        name: "Plomberie",
        slug: "plomberie",
        defaultSharedLeadPriceCents: 2500,
        defaultExclusiveLeadPriceCents: 5500,
        subCategories: [
          { name: "Nouvelle installation", slug: "nouvelle-installation" },
          { name: "Dépannage urgent", slug: "depannage-urgent" },
          { name: "Rénovation salle de bain", slug: "renovation-sdb" },
        ],
      },
      {
        name: "Chauffage",
        slug: "chauffage",
        defaultSharedLeadPriceCents: 2500,
        defaultExclusiveLeadPriceCents: 5500,
        subCategories: [
          { name: "Nouvelle installation", slug: "nouvelle-installation" },
          { name: "Entretien annuel", slug: "entretien-annuel" },
          { name: "Dépannage urgent", slug: "depannage-urgent" },
        ],
      },
      {
        name: "Électricité",
        slug: "electricite",
        defaultSharedLeadPriceCents: 2500,
        defaultExclusiveLeadPriceCents: 5500,
        subCategories: [
          { name: "Mise aux normes", slug: "mise-aux-normes" },
          { name: "Nouvelle installation", slug: "nouvelle-installation" },
          { name: "Dépannage urgent", slug: "depannage-urgent" },
        ],
      },
      {
        name: "Climatisation",
        slug: "climatisation",
        defaultSharedLeadPriceCents: 2500,
        defaultExclusiveLeadPriceCents: 5500,
        subCategories: [
          { name: "Pose climatisation", slug: "pose" },
          { name: "Entretien", slug: "entretien" },
        ],
      },
      {
        name: "Énergies renouvelables",
        slug: "energies-renouvelables",
        defaultSharedLeadPriceCents: 3500,
        defaultExclusiveLeadPriceCents: 7000,
        subCategories: [
          { name: "Pompe à chaleur", slug: "pompe-a-chaleur" },
          { name: "Panneaux solaires", slug: "panneaux-solaires" },
          { name: "Borne de recharge", slug: "borne-de-recharge" },
        ],
      },
    ],
  },
  {
    name: "Rénovation & Intérieur",
    slug: "renovation-interieur",
    iconName: "paint-bucket",
    categories: [
      {
        name: "Peinture",
        slug: "peinture",
        defaultSharedLeadPriceCents: 2000,
        defaultExclusiveLeadPriceCents: 4500,
        subCategories: [
          { name: "Intérieur", slug: "interieur" },
          { name: "Extérieur", slug: "exterieur" },
        ],
      },
      {
        name: "Carrelage & Sols",
        slug: "carrelage-sols",
        defaultSharedLeadPriceCents: 2000,
        defaultExclusiveLeadPriceCents: 4500,
        subCategories: [
          { name: "Pose carrelage", slug: "pose-carrelage" },
          { name: "Parquet", slug: "parquet" },
          { name: "Sol souple / vinyle", slug: "sol-souple" },
        ],
      },
      {
        name: "Menuiserie intérieure",
        slug: "menuiserie-interieure",
        defaultSharedLeadPriceCents: 2500,
        defaultExclusiveLeadPriceCents: 5500,
        subCategories: [
          { name: "Portes intérieures", slug: "portes" },
          { name: "Placards / dressing", slug: "placards" },
          { name: "Escalier", slug: "escalier" },
        ],
      },
      {
        name: "Plâtrerie & Cloisons",
        slug: "platrerie-cloisons",
        defaultSharedLeadPriceCents: 2000,
        defaultExclusiveLeadPriceCents: 4500,
        subCategories: [
          { name: "Cloisons placo", slug: "cloisons-placo" },
          { name: "Faux plafond", slug: "faux-plafond" },
        ],
      },
      {
        name: "Cuisine & Salle de bain",
        slug: "cuisine-sdb",
        defaultSharedLeadPriceCents: 3000,
        defaultExclusiveLeadPriceCents: 6500,
        subCategories: [
          { name: "Aménagement cuisine", slug: "amenagement-cuisine" },
          { name: "Rénovation salle de bain", slug: "renovation-sdb" },
        ],
      },
    ],
  },
  {
    name: "Extérieur & Aménagement",
    slug: "exterieur-amenagement",
    iconName: "trees",
    categories: [
      {
        name: "Jardinage & Paysagisme",
        slug: "jardinage-paysagisme",
        defaultSharedLeadPriceCents: 1500,
        defaultExclusiveLeadPriceCents: 3500,
        subCategories: [
          { name: "Création de jardin", slug: "creation-jardin" },
          { name: "Entretien régulier", slug: "entretien-regulier" },
          { name: "Élagage / abattage", slug: "elagage-abattage" },
        ],
      },
      {
        name: "Terrasse & Clôture",
        slug: "terrasse-cloture",
        defaultSharedLeadPriceCents: 2000,
        defaultExclusiveLeadPriceCents: 4500,
        subCategories: [
          { name: "Terrasse bois / composite", slug: "terrasse-bois" },
          { name: "Terrasse béton / pierre", slug: "terrasse-beton" },
          { name: "Clôture", slug: "cloture" },
        ],
      },
      {
        name: "Piscine",
        slug: "piscine",
        defaultSharedLeadPriceCents: 3500,
        defaultExclusiveLeadPriceCents: 7500,
        subCategories: [
          { name: "Construction piscine", slug: "construction" },
          { name: "Entretien / rénovation", slug: "entretien-renovation" },
        ],
      },
    ],
  },
  {
    name: "Urgence & Services",
    slug: "urgence-services",
    iconName: "siren",
    categories: [
      {
        name: "Serrurerie",
        slug: "serrurerie",
        defaultSharedLeadPriceCents: 2000,
        defaultExclusiveLeadPriceCents: 4500,
        subCategories: [
          { name: "Ouverture de porte urgente", slug: "ouverture-urgente" },
          { name: "Changement de serrure", slug: "changement-serrure" },
          { name: "Blindage / sécurisation", slug: "blindage" },
        ],
      },
      {
        name: "Vitrerie",
        slug: "vitrerie",
        defaultSharedLeadPriceCents: 2000,
        defaultExclusiveLeadPriceCents: 4500,
        subCategories: [
          { name: "Remplacement de vitre", slug: "remplacement" },
          { name: "Double vitrage", slug: "double-vitrage" },
        ],
      },
    ],
  },
  {
    name: "Autre",
    slug: "autre",
    iconName: "more-horizontal",
    categories: [
      {
        name: "Autres travaux",
        slug: "autres-travaux",
        defaultSharedLeadPriceCents: 2000,
        defaultExclusiveLeadPriceCents: 4500,
        subCategories: [{ name: "À préciser", slug: "a-preciser" }],
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
