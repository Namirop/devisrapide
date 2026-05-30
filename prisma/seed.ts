import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { seedFakes } from "./seed-fakes";

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

// Catalogue BE — 6 univers / 24 catégories / 61 sous-catégories.
// Aligné sur la liste métier fournie par Kamel (référence "Question 6").
//
// Prix (centimes) par palier :
//   - lourd  : 3500 / 8750  → gros chantier (Toiture, Maçonnerie, Façade,
//              Châssis, Énergie, Piscine & Spa)
//   - medium : 2500 / 6250  → installation/intervention standard
//   - light  : 2000 / 5000  → prestation courte (Peinture, Carrelage,
//              Plafonnage, Jardin, Nettoyage, Logistique)
//   - urgence: 3000 / 7500  → univers Urgence & Services (intervention rapide)
//
// "Autre" utilise le pattern wrapper category : 1 seule cat avec 2 sub-cats.
// Le wizard pourra sauter le Step 2 quand universe.categories.length === 1
// (heuristique générique, Sprint 2 UI).
const CATALOGUE: UniverseSeed[] = [
  // ═══ Univers 1 : Gros œuvre & Toiture ═══════════════════════
  {
    name: "Gros œuvre & Toiture",
    slug: "gros-oeuvre-toiture",
    iconName: "brick-wall",
    categories: [
      {
        name: "Toiture",
        slug: "toiture",
        defaultSharedLeadPriceCents: 3500,
        defaultExclusiveLeadPriceCents: 8750,
        subCategories: [
          { name: "Installation complète", slug: "installation-complete" },
          { name: "Réparation fuite", slug: "reparation-fuite" },
          { name: "Nettoyage & démoussage", slug: "nettoyage-demoussage" },
        ],
      },
      {
        name: "Maçonnerie",
        slug: "maconnerie",
        defaultSharedLeadPriceCents: 3500,
        defaultExclusiveLeadPriceCents: 8750,
        subCategories: [
          { name: "Extension & annexe", slug: "extension-annexe" },
          { name: "Dalle & fondations", slug: "dalle-fondations" },
          { name: "Petit mur & réparation", slug: "petit-mur-reparation" },
        ],
      },
      {
        name: "Façade",
        slug: "facade",
        defaultSharedLeadPriceCents: 3500,
        defaultExclusiveLeadPriceCents: 8750,
        subCategories: [
          { name: "Crépi & isolation", slug: "crepi-isolation" },
          { name: "Sablage & nettoyage", slug: "sablage-nettoyage" },
          { name: "Rejointoiement", slug: "rejointoiement" },
        ],
      },
      {
        name: "Châssis",
        slug: "chassis",
        defaultSharedLeadPriceCents: 3500,
        defaultExclusiveLeadPriceCents: 8750,
        subCategories: [
          { name: "Pose complète (neuf / rénovation)", slug: "pose-complete" },
          { name: "Réparation & vitrage", slug: "reparation-vitrage" },
        ],
      },
    ],
  },

  // ═══ Univers 2 : Techniques & Énergie ════════════════════════
  {
    name: "Techniques & Énergie",
    slug: "techniques-energie",
    iconName: "zap",
    categories: [
      {
        name: "Chauffage",
        slug: "chauffage",
        defaultSharedLeadPriceCents: 2500,
        defaultExclusiveLeadPriceCents: 6250,
        subCategories: [
          { name: "Nouvelle installation", slug: "nouvelle-installation" },
          { name: "Entretien annuel", slug: "entretien-annuel" },
          { name: "Dépannage urgent", slug: "depannage-urgent" },
        ],
      },
      {
        name: "Climatisation",
        slug: "climatisation",
        defaultSharedLeadPriceCents: 2500,
        defaultExclusiveLeadPriceCents: 6250,
        subCategories: [
          { name: "Installation", slug: "installation" },
          { name: "Entretien & réparation", slug: "entretien-reparation" },
        ],
      },
      {
        name: "Électricité",
        slug: "electricite",
        defaultSharedLeadPriceCents: 2500,
        defaultExclusiveLeadPriceCents: 6250,
        subCategories: [
          { name: "Mise en conformité", slug: "mise-en-conformite" },
          { name: "Nouvelle installation", slug: "nouvelle-installation" },
          { name: "Dépannage urgent", slug: "depannage-urgent" },
        ],
      },
      {
        name: "Plomberie",
        slug: "plomberie",
        defaultSharedLeadPriceCents: 2500,
        defaultExclusiveLeadPriceCents: 6250,
        subCategories: [
          { name: "Installation complète", slug: "installation-complete" },
          { name: "Fuite & dépannage", slug: "fuite-depannage" },
          { name: "Débouchage", slug: "debouchage" },
        ],
      },
      {
        name: "Énergie",
        slug: "energie",
        defaultSharedLeadPriceCents: 3500,
        defaultExclusiveLeadPriceCents: 8750,
        subCategories: [
          { name: "Panneaux solaires", slug: "panneaux-solaires" },
          { name: "Isolation (combles / murs)", slug: "isolation" },
          { name: "Borne de recharge", slug: "borne-de-recharge" },
        ],
      },
    ],
  },

  // ═══ Univers 3 : Rénovation & Intérieur ══════════════════════
  {
    name: "Rénovation & Intérieur",
    slug: "renovation-interieur",
    iconName: "paintbrush",
    categories: [
      {
        name: "Rénovation intérieure",
        slug: "renovation-interieure",
        defaultSharedLeadPriceCents: 2500,
        defaultExclusiveLeadPriceCents: 6250,
        subCategories: [
          { name: "Transformation complète", slug: "transformation-complete" },
          { name: "Aménagement de grenier", slug: "amenagement-grenier" },
        ],
      },
      {
        name: "Cuisine",
        slug: "cuisine",
        defaultSharedLeadPriceCents: 2500,
        defaultExclusiveLeadPriceCents: 6250,
        subCategories: [
          { name: "Création complète", slug: "creation-complete" },
          { name: "Rénovation partielle", slug: "renovation-partielle" },
        ],
      },
      {
        name: "Salle de bain",
        slug: "salle-de-bain",
        defaultSharedLeadPriceCents: 2500,
        defaultExclusiveLeadPriceCents: 6250,
        subCategories: [
          { name: "Création complète", slug: "creation-complete" },
          { name: "Rénovation partielle", slug: "renovation-partielle" },
        ],
      },
      {
        name: "Menuiserie intérieure",
        slug: "menuiserie-interieure",
        defaultSharedLeadPriceCents: 2500,
        defaultExclusiveLeadPriceCents: 6250,
        subCategories: [
          { name: "Escaliers", slug: "escaliers" },
          { name: "Placards sur mesure", slug: "placards-sur-mesure" },
          { name: "Portes intérieures", slug: "portes-interieures" },
        ],
      },
      {
        name: "Peinture",
        slug: "peinture",
        defaultSharedLeadPriceCents: 2000,
        defaultExclusiveLeadPriceCents: 5000,
        subCategories: [
          { name: "Projet complet", slug: "projet-complet" },
          { name: "Réparation", slug: "reparation" },
        ],
      },
      {
        name: "Carrelage",
        slug: "carrelage",
        defaultSharedLeadPriceCents: 2000,
        defaultExclusiveLeadPriceCents: 5000,
        subCategories: [
          { name: "Projet complet", slug: "projet-complet" },
          { name: "Réparation", slug: "reparation" },
        ],
      },
      {
        name: "Plafonnage",
        slug: "plafonnage",
        defaultSharedLeadPriceCents: 2000,
        defaultExclusiveLeadPriceCents: 5000,
        subCategories: [
          { name: "Projet complet", slug: "projet-complet" },
          { name: "Réparation", slug: "reparation" },
        ],
      },
    ],
  },

  // ═══ Univers 4 : Extérieur & Aménagement ═════════════════════
  {
    name: "Extérieur & Aménagement",
    slug: "exterieur-amenagement",
    iconName: "trees",
    categories: [
      {
        name: "Aménagement extérieur",
        slug: "amenagement-exterieur",
        defaultSharedLeadPriceCents: 2500,
        defaultExclusiveLeadPriceCents: 6250,
        subCategories: [
          { name: "Terrasse", slug: "terrasse" },
          { name: "Pavage & allée", slug: "pavage-allee" },
          { name: "Clôture & portail", slug: "cloture-portail" },
        ],
      },
      {
        name: "Jardin",
        slug: "jardin",
        defaultSharedLeadPriceCents: 2000,
        defaultExclusiveLeadPriceCents: 5000,
        subCategories: [
          { name: "Création & plantation", slug: "creation-plantation" },
          { name: "Élagage & abattage", slug: "elagage-abattage" },
          { name: "Entretien saisonnier", slug: "entretien-saisonnier" },
        ],
      },
      {
        name: "Piscine & Spa",
        slug: "piscine-spa",
        defaultSharedLeadPriceCents: 3500,
        defaultExclusiveLeadPriceCents: 8750,
        subCategories: [
          { name: "Construction", slug: "construction" },
          { name: "Entretien", slug: "entretien" },
          { name: "Abri & volet", slug: "abri-volet" },
        ],
      },
    ],
  },

  // ═══ Univers 5 : Urgence & Services ══════════════════════════
  {
    name: "Urgence & Services",
    slug: "urgence-services",
    iconName: "siren",
    categories: [
      {
        name: "Serrurerie",
        slug: "serrurerie",
        defaultSharedLeadPriceCents: 3000,
        defaultExclusiveLeadPriceCents: 7500,
        subCategories: [
          { name: "Ouverture de porte", slug: "ouverture-porte" },
          { name: "Remplacement serrure", slug: "remplacement-serrure" },
          { name: "Sécurisation / blindage", slug: "securisation-blindage" },
        ],
      },
      {
        name: "Débouchage & Vidange",
        slug: "debouchage-vidange",
        defaultSharedLeadPriceCents: 3000,
        defaultExclusiveLeadPriceCents: 7500,
        subCategories: [
          { name: "Canalisation bouchée", slug: "canalisation-bouchee" },
          { name: "Vidange fosse septique", slug: "vidange-fosse-septique" },
        ],
      },
      {
        name: "Nettoyage",
        slug: "nettoyage",
        defaultSharedLeadPriceCents: 2000,
        defaultExclusiveLeadPriceCents: 5000,
        subCategories: [
          { name: "Maison / appartement", slug: "maison-appartement" },
          { name: "Bureaux / professionnel", slug: "bureaux-professionnel" },
          { name: "Après chantier", slug: "apres-chantier" },
        ],
      },
      {
        name: "Logistique",
        slug: "logistique",
        defaultSharedLeadPriceCents: 2000,
        defaultExclusiveLeadPriceCents: 5000,
        subCategories: [
          { name: "Déménagement", slug: "demenagement" },
          { name: "Vide maison / débarras", slug: "vide-maison-debarras" },
        ],
      },
    ],
  },

  // ═══ Univers 6 : Autre (wrapper category) ════════════════════
  {
    name: "Autre",
    slug: "autre",
    iconName: "help-circle",
    categories: [
      {
        // Pattern "wrapper category" : 1 seule cat → Step 2 du wizard sera
        // sauté (heuristique categories.length === 1, Sprint 2 UI).
        name: "Autre",
        slug: "autre",
        defaultSharedLeadPriceCents: 2500,
        defaultExclusiveLeadPriceCents: 6250,
        subCategories: [
          {
            name: "Mon projet n'est pas dans la liste",
            slug: "projet-non-liste",
          },
          {
            name: "Demande multi-travaux (rénovation complète)",
            slug: "multi-travaux",
          },
        ],
      },
    ],
  },
];

// ─── APP CONFIG ────────────────────────────────────────────

const APP_CONFIG: Array<Omit<Prisma.AppConfigCreateInput, "updatedAt">> = [
  {
    key: "RADIUS_PALIERS_KM",
    // -1 = sentinel OPEN (toute la zone V1 = Wallonie + Bruxelles francophone).
    value: "[30,60,-1]",
    valueType: "json",
    description:
      "Paliers d'élargissement du rayon de matching (km). -1 = OPEN.",
  },
  {
    key: "ZONE_EXPANSION_DELAYS_MIN",
    // [120, 240] : 2h entre palier 1 et 2, puis 4h entre 2 et OPEN.
    value: "[120,240]",
    valueType: "json",
    description: "Délais (minutes) entre les paliers d'élargissement de zone.",
  },
  {
    key: "RESPONSE_DELAY_MINUTES",
    value: "120",
    valueType: "int",
    description:
      "Délai accordé au pro pour accepter un lead avant expiration de l'assignment.",
  },
  {
    key: "LEAD_GLOBAL_TIMEOUT_HOURS",
    value: "24",
    valueType: "int",
    description: "Délai global avant expiration définitive d'un lead.",
  },
  {
    key: "SHARED_LEAD_MAX_ACCEPTANCES",
    value: "3",
    valueType: "int",
    description:
      "Nombre maximum de pros pouvant accepter un même lead partagé.",
  },
  {
    key: "EXCLUSIVE_PRICE_MULTIPLIER_DEFAULT",
    value: "2.5",
    valueType: "float",
    description:
      "Multiplicateur appliqué au prix partagé pour le mode exclusif (cible BE).",
  },
  {
    key: "WALLET_PACKS",
    // Packs Phase 4 BE : Découverte 70/70, Boost 300/350 (+50), Domination 800/1000 (+200).
    value: JSON.stringify([
      {
        id: "decouverte",
        priceEur: 70,
        creditEur: 70,
        bonusEur: 0,
        label: "Découverte",
      },
      {
        id: "boost",
        priceEur: 300,
        creditEur: 350,
        bonusEur: 50,
        label: "Boost",
        featured: true,
      },
      {
        id: "domination",
        priceEur: 800,
        creditEur: 1000,
        bonusEur: 200,
        label: "Domination",
      },
    ]),
    valueType: "json",
    description: "Packs de rechargement wallet pro avec bonus (Phase 4 BE).",
  },
];

// Reconcilie la BDD avec le CATALOGUE en supprimant les enregistrements
// orphelins aux 3 niveaux : Univers, Category, SubCategory.
//
// Best-effort : si des Leads ou ProCategories pointent vers un enregistrement
// (FK Restrict), la suppression echoue et est ignoree avec un warning.
//
// Utile lors de refontes catalogue ou de modifications fines (ex: retrait
// d'une sous-categorie, renommage de slug, etc.).
async function purgeOrphanCatalogue() {
  let universesDeleted = 0;
  let categoriesDeleted = 0;
  let subCategoriesDeleted = 0;

  // ── Niveau 1 : univers absents du CATALOGUE ─────────────────
  const validUniverseSlugs = new Set(CATALOGUE.map((u) => u.slug));
  const orphanUniverses = await prisma.universe.findMany({
    where: { slug: { notIn: [...validUniverseSlugs] } },
    select: { id: true, slug: true },
  });
  for (const u of orphanUniverses) {
    try {
      const cats = await prisma.category.findMany({
        where: { universeId: u.id },
        select: { id: true },
      });
      for (const c of cats) {
        await prisma.subCategory.deleteMany({ where: { categoryId: c.id } });
      }
      await prisma.category.deleteMany({ where: { universeId: u.id } });
      await prisma.universe.delete({ where: { id: u.id } });
      universesDeleted++;
      console.log(`[seed]   ✓ univers supprimé : ${u.slug}`);
    } catch (err) {
      console.warn(
        `[seed]   ⚠️  impossible de supprimer univers "${u.slug}" — probablement des Leads / ProCategories lies. Ignore.`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  // ── Niveaux 2 et 3 : pour chaque univers conserve, supprimer
  // les categories et sous-categories absentes du seed.
  for (const universeSeed of CATALOGUE) {
    const universe = await prisma.universe.findUnique({
      where: { slug: universeSeed.slug },
      select: { id: true },
    });
    if (!universe) continue; // Premier seed : l'univers sera cree par seedCatalogue.

    // ── Categories orphelines au sein de cet univers ──────────
    const validCatSlugs = new Set(universeSeed.categories.map((c) => c.slug));
    const orphanCats = await prisma.category.findMany({
      where: {
        universeId: universe.id,
        slug: { notIn: [...validCatSlugs] },
      },
      select: { id: true, slug: true },
    });
    for (const c of orphanCats) {
      try {
        await prisma.subCategory.deleteMany({ where: { categoryId: c.id } });
        await prisma.category.delete({ where: { id: c.id } });
        categoriesDeleted++;
        console.log(
          `[seed]   ✓ cat supprimée : ${universeSeed.slug}/${c.slug}`,
        );
      } catch (err) {
        console.warn(
          `[seed]   ⚠️  impossible de supprimer cat "${universeSeed.slug}/${c.slug}". Ignore.`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    // ── Sub-categories orphelines au sein des categories conservees ──
    for (const catSeed of universeSeed.categories) {
      const cat = await prisma.category.findFirst({
        where: { universeId: universe.id, slug: catSeed.slug },
        select: { id: true },
      });
      if (!cat) continue;
      const validSubSlugs = new Set(catSeed.subCategories.map((s) => s.slug));
      const orphanSubs = await prisma.subCategory.findMany({
        where: {
          categoryId: cat.id,
          slug: { notIn: [...validSubSlugs] },
        },
        select: { id: true, slug: true },
      });
      for (const s of orphanSubs) {
        try {
          await prisma.subCategory.delete({ where: { id: s.id } });
          subCategoriesDeleted++;
          console.log(
            `[seed]   ✓ sub supprimée : ${universeSeed.slug}/${catSeed.slug}/${s.slug}`,
          );
        } catch (err) {
          console.warn(
            `[seed]   ⚠️  impossible de supprimer sub "${universeSeed.slug}/${catSeed.slug}/${s.slug}". Ignore.`,
            err instanceof Error ? err.message : err,
          );
        }
      }
    }
  }

  if (universesDeleted + categoriesDeleted + subCategoriesDeleted > 0) {
    console.log(
      `[seed] purge totale : ${universesDeleted} univers, ${categoriesDeleted} cat, ${subCategoriesDeleted} sub supprimes.`,
    );
  }
}

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
  // Admin principal (Kamel en prod, ou un compte d'eval). Toujours seede
  // si les env vars sont presentes.
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!email || !password) {
    console.warn(
      "[seed] ADMIN_EMAIL / ADMIN_INITIAL_PASSWORD manquants - admin non seedé.",
    );
  } else {
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
}

async function main() {
  await purgeOrphanCatalogue();
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

  // Remplissage (faux pros/leads) : active via `pnpm db:seed:fakes`
  // (= `prisma db seed -- --fakes`). Idempotent : clear + recreate sur
  // les emails .test@example.test. Ne JAMAIS lancer sur la vraie prod.
  if (process.argv.includes("--fakes")) {
    await seedFakes(prisma);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
