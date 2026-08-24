import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { seedFakes } from "./seed-fakes";

const prisma = new PrismaClient();

// ─── CATALOGUE ─────────────────────────────────────────────
// Prix en centimes.

type SubSeed = { name: string; slug: string };

type CategorySeed = {
  name: string;
  slug: string;
  defaultSharedLeadPriceCents: number;
  defaultExclusiveLeadPriceCents: number;
  // Diffusion a tout pro de la zone + auto-accept neutralise.
  // Cf. Category.isCatchAll dans prisma/schema.prisma.
  isCatchAll?: boolean;
  subCategories: SubSeed[];
};

type UniverseSeed = {
  name: string;
  slug: string;
  description?: string;
  iconName?: string;
  categories: CategorySeed[];
};

// Helper sous-categorie (reduit le bruit visuel du catalogue).
const sc = (name: string, slug: string): SubSeed => ({ name, slug });

// Paliers de prix (centimes) — shared / exclusive :
//   - LOURD   : 3500 / 8750  → gros chantier (Toiture, Façade, Maçonnerie,
//               Énergie, Châssis, Structures extérieures, Piscine & Bien-être)
//   - MEDIUM  : 2500 / 6250  → installation/intervention standard
//   - LIGHT   : 2000 / 5000  → prestation courte (Sols & murs, Jardin,
//               Nettoyage, Débarras)
//   - URGENCE : 3000 / 7500  → univers Dépannage & Urgences
const LOURD = {
  defaultSharedLeadPriceCents: 3500,
  defaultExclusiveLeadPriceCents: 8750,
};
const MEDIUM = {
  defaultSharedLeadPriceCents: 2500,
  defaultExclusiveLeadPriceCents: 6250,
};
const LIGHT = {
  defaultSharedLeadPriceCents: 2000,
  defaultExclusiveLeadPriceCents: 5000,
};
const URGENCE = {
  defaultSharedLeadPriceCents: 3000,
  defaultExclusiveLeadPriceCents: 7500,
};

// Catalogue officiel V1 — 9 univers métier (alignés 1:1 sur les 9 tuiles/
// icônes de la landing, cf. src/lib/categories.ts) + 1 univers "Autre"
// (filet de sécurité accessible uniquement dans le wizard, pas sur la landing).
//
// 10 univers / 28 catégories / 142 sous-catégories.
//
// Univers "plats" sans niveau intermédiaire naturel (Rénovation intérieure,
// Dépannage & Urgences) : regroupés en catégories logiques pour conserver une
// structure 3 niveaux propre (évite un Step 2 à choix unique dans le wizard).
//
// "Autre" : pattern wrapper category (1 seule cat). Le Step 2 reste affiché
// avec un choix unique — acceptable pour ce filet de sécurité marginal.
const CATALOGUE: UniverseSeed[] = [
  // ═══ Univers 1 : Toiture, Façade & Maçonnerie ════════════════
  {
    name: "Toiture, Façade & Maçonnerie",
    slug: "toiture-facade-maconnerie",
    iconName: "house",
    categories: [
      {
        name: "Toiture",
        slug: "toiture",
        ...LOURD,
        subCategories: [
          sc("Installation complète", "installation-complete"),
          sc("Rénovation toiture", "renovation-toiture"),
          sc("Réparation fuite", "reparation-fuite"),
          sc("Nettoyage & démoussage", "nettoyage-demoussage"),
          sc("Isolation toiture", "isolation-toiture"),
          sc("Gouttières & zinguerie", "gouttieres-zinguerie"),
          sc("Toiture plate", "toiture-plate"),
          sc("Toiture inclinée", "toiture-inclinee"),
          sc("Velux & fenêtres de toit", "velux-fenetres-toit"),
        ],
      },
      {
        name: "Façade",
        slug: "facade",
        ...LOURD,
        subCategories: [
          sc("Crépi & isolation", "crepi-isolation"),
          sc("Isolation extérieure", "isolation-exterieure"),
          sc("Rejointoiement", "rejointoiement"),
          sc("Sablage & nettoyage", "sablage-nettoyage"),
          sc("Hydrofuge", "hydrofuge"),
          sc("Peinture façade", "peinture-facade"),
          sc("Rénovation façade", "renovation-facade"),
        ],
      },
      {
        name: "Maçonnerie",
        slug: "maconnerie",
        ...LOURD,
        subCategories: [
          sc("Extension & annexe", "extension-annexe"),
          sc("Dalle & fondations", "dalle-fondations"),
          sc("Terrassement", "terrassement"),
          sc("Ouverture mur porteur", "ouverture-mur-porteur"),
          sc("Mur de soutènement", "mur-soutenement"),
          sc("Petit mur & réparation", "petit-mur-reparation"),
          sc("Construction garage", "construction-garage"),
          sc("Béton & coffrage", "beton-coffrage"),
        ],
      },
    ],
  },

  // ═══ Univers 2 : Électricité, Énergie & Sécurité ═════════════
  {
    name: "Électricité, Énergie & Sécurité",
    slug: "electricite-energie-securite",
    iconName: "zap",
    categories: [
      {
        name: "Électricité",
        slug: "electricite",
        ...MEDIUM,
        subCategories: [
          sc("Mise en conformité", "mise-en-conformite"),
          sc("Nouvelle installation", "nouvelle-installation"),
          sc("Dépannage électrique", "depannage-electrique"),
          sc("Tableau électrique", "tableau-electrique"),
          sc("Éclairage intérieur", "eclairage-interieur"),
          sc("Éclairage extérieur", "eclairage-exterieur"),
          sc("Domotique", "domotique"),
        ],
      },
      {
        name: "Énergie",
        slug: "energie",
        ...LOURD,
        subCategories: [
          sc("Panneaux solaires", "panneaux-solaires"),
          sc("Batterie domestique", "batterie-domestique"),
          sc("Borne de recharge véhicule électrique", "borne-de-recharge"),
          sc("Isolation combles", "isolation-combles"),
          sc("Isolation murs", "isolation-murs"),
          sc("Audit énergétique", "audit-energetique"),
        ],
      },
      {
        name: "Sécurité",
        slug: "securite",
        ...MEDIUM,
        subCategories: [
          sc("Alarme intrusion", "alarme-intrusion"),
          sc("Caméras de surveillance", "cameras-surveillance"),
          sc("Contrôle d'accès", "controle-acces"),
          sc("Vidéophonie", "videophonie"),
          sc("Interphone", "interphone"),
        ],
      },
    ],
  },

  // ═══ Univers 3 : Plomberie, Chauffage & Climatisation ════════
  {
    name: "Plomberie, Chauffage & Climatisation",
    slug: "plomberie-chauffage-climatisation",
    iconName: "droplet",
    categories: [
      {
        name: "Plomberie",
        slug: "plomberie",
        ...MEDIUM,
        subCategories: [
          sc("Installation complète", "installation-complete"),
          sc("Fuite & dépannage", "fuite-depannage"),
          sc("Débouchage canalisation", "debouchage-canalisation"),
          sc("Canalisations", "canalisations"),
          sc("Adoucisseur d'eau", "adoucisseur-eau"),
        ],
      },
      {
        name: "Chauffage",
        slug: "chauffage",
        ...MEDIUM,
        subCategories: [
          sc("Nouvelle installation", "nouvelle-installation"),
          sc("Entretien chaudière", "entretien-chaudiere"),
          sc("Dépannage chauffage", "depannage-chauffage"),
          sc("Chauffage sol", "chauffage-sol"),
          sc("Pompe à chaleur", "pompe-a-chaleur"),
          sc("Chaudière gaz", "chaudiere-gaz"),
          sc("Chaudière mazout", "chaudiere-mazout"),
        ],
      },
      {
        name: "Climatisation",
        slug: "climatisation",
        ...MEDIUM,
        subCategories: [
          sc("Installation", "installation"),
          sc("Entretien", "entretien"),
          sc("Réparation", "reparation"),
        ],
      },
    ],
  },

  // ═══ Univers 4 : Châssis, Portes & Fermetures ════════════════
  {
    name: "Châssis, Portes & Fermetures",
    slug: "chassis-portes-fermetures",
    iconName: "door-open",
    categories: [
      {
        name: "Châssis",
        slug: "chassis",
        ...LOURD,
        subCategories: [
          sc("Installation ou remplacement de châssis", "installation-remplacement"),
          sc("Réparation châssis", "reparation-chassis"),
          sc("Remplacement vitrage", "remplacement-vitrage"),
        ],
      },
      {
        name: "Fermetures",
        slug: "fermetures",
        ...MEDIUM,
        subCategories: [
          sc("Portes d'entrée", "portes-entree"),
          sc("Portes de garage", "portes-garage"),
          sc("Volets", "volets"),
          sc("Stores extérieurs", "stores-exterieurs"),
          sc("Moustiquaires", "moustiquaires"),
        ],
      },
      {
        name: "Structures extérieures",
        slug: "structures-exterieures",
        ...LOURD,
        subCategories: [
          sc("Vérandas", "verandas"),
          sc("Pergolas", "pergolas"),
        ],
      },
    ],
  },

  // ═══ Univers 5 : Cuisine & Salle de bain ═════════════════════
  {
    name: "Cuisine & Salle de bain",
    slug: "cuisine-salle-de-bain",
    iconName: "bath",
    categories: [
      {
        name: "Cuisine",
        slug: "cuisine",
        ...MEDIUM,
        subCategories: [
          sc("Création complète", "creation-complete"),
          sc("Rénovation", "renovation"),
          sc("Cuisine sur mesure", "cuisine-sur-mesure"),
          sc("Pose cuisine", "pose-cuisine"),
        ],
      },
      {
        name: "Salle de bain",
        slug: "salle-de-bain",
        ...MEDIUM,
        subCategories: [
          sc("Création complète", "creation-complete"),
          sc("Rénovation", "renovation"),
          sc("Douche italienne", "douche-italienne"),
          sc("Baignoire", "baignoire"),
          sc("Sanitaires", "sanitaires"),
          sc("PMR (accessibilité)", "pmr"),
        ],
      },
    ],
  },

  // ═══ Univers 6 : Rénovation intérieure ═══════════════════════
  // Univers "plat" → regroupé en 4 catégories logiques.
  {
    name: "Rénovation intérieure",
    slug: "renovation-interieure",
    iconName: "paintbrush",
    categories: [
      {
        name: "Rénovation globale",
        slug: "renovation-globale",
        ...MEDIUM,
        subCategories: [
          sc("Transformation complète", "transformation-complete"),
          sc("Rénovation appartement", "renovation-appartement"),
          sc("Rénovation maison", "renovation-maison"),
          sc("Aménagement grenier", "amenagement-grenier"),
        ],
      },
      {
        name: "Isolation & cloisons",
        slug: "isolation-cloisons",
        ...MEDIUM,
        subCategories: [
          sc("Isolation intérieure", "isolation-interieure"),
          sc("Cloisons", "cloisons"),
          sc("Faux plafonds", "faux-plafonds"),
          sc("Plafonnage", "plafonnage"),
        ],
      },
      {
        name: "Sols & murs",
        slug: "sols-murs",
        ...LIGHT,
        subCategories: [
          sc("Peinture", "peinture"),
          sc("Carrelage", "carrelage"),
          sc("Parquet", "parquet"),
          sc("Revêtements de sol", "revetements-sol"),
        ],
      },
      {
        name: "Menuiserie intérieure",
        slug: "menuiserie-interieure",
        ...MEDIUM,
        subCategories: [
          sc("Escaliers", "escaliers"),
          sc("Placards sur mesure", "placards-sur-mesure"),
          sc("Portes intérieures", "portes-interieures"),
        ],
      },
    ],
  },

  // ═══ Univers 7 : Jardin & Aménagement extérieur ══════════════
  {
    name: "Jardin & Aménagement extérieur",
    slug: "jardin-amenagement-exterieur",
    iconName: "trees",
    categories: [
      {
        name: "Aménagement extérieur",
        slug: "amenagement-exterieur",
        ...MEDIUM,
        subCategories: [
          sc("Terrasse", "terrasse"),
          sc("Terrasse bois", "terrasse-bois"),
          sc("Terrasse composite", "terrasse-composite"),
          sc("Pavage", "pavage"),
          sc("Allée", "allee"),
          sc("Clôture", "cloture"),
          sc("Portail", "portail"),
          sc("Terrassement", "terrassement"),
          sc("Enrobé", "enrobe"),
          sc("Béton extérieur", "beton-exterieur"),
        ],
      },
      {
        name: "Jardin",
        slug: "jardin",
        ...LIGHT,
        subCategories: [
          sc("Création jardin", "creation-jardin"),
          sc("Plantation", "plantation"),
          sc("Entretien jardin", "entretien-jardin"),
          sc("Taille de haie", "taille-haie"),
          sc("Élagage", "elagage"),
          sc("Abattage", "abattage"),
          sc("Arrosage automatique", "arrosage-automatique"),
          sc("Robot tondeuse", "robot-tondeuse"),
        ],
      },
      {
        name: "Piscine & Bien-être",
        slug: "piscine-bien-etre",
        ...LOURD,
        subCategories: [
          sc("Piscine", "piscine"),
          sc("Entretien piscine", "entretien-piscine"),
          sc("Spa", "spa"),
          sc("Jacuzzi", "jacuzzi"),
          sc("Pool house", "pool-house"),
          sc("Abri piscine", "abri-piscine"),
          sc("Volet piscine", "volet-piscine"),
        ],
      },
    ],
  },

  // ═══ Univers 8 : Dépannage & Urgences ════════════════════════
  // Univers "plat" + urgent → regroupé en 3 catégories (prix URGENCE).
  {
    name: "Dépannage & Urgences",
    slug: "depannage-urgences",
    iconName: "siren",
    categories: [
      {
        name: "Serrurerie & sécurité",
        slug: "serrurerie-securite",
        ...URGENCE,
        subCategories: [
          sc("Serrurerie urgente", "serrurerie-urgente"),
          sc("Ouverture de porte", "ouverture-porte"),
          sc("Remplacement serrure", "remplacement-serrure"),
          sc("Blindage porte", "blindage-porte"),
        ],
      },
      {
        name: "Plomberie & chauffage urgents",
        slug: "plomberie-chauffage-urgents",
        ...URGENCE,
        subCategories: [
          sc("Dépannage plomberie urgent", "depannage-plomberie"),
          sc("Dépannage chauffage urgent", "depannage-chauffage"),
          sc("Débouchage urgent", "debouchage-urgent"),
          sc("Recherche fuite urgente", "recherche-fuite"),
        ],
      },
      {
        name: "Électricité & intervention 24/7",
        slug: "electricite-24-7",
        ...URGENCE,
        subCategories: [
          sc("Dépannage électrique urgent", "depannage-electrique"),
          sc("Intervention urgence 24/7", "intervention-24-7"),
        ],
      },
    ],
  },

  // ═══ Univers 9 : Déménagement, Nettoyage & Services ══════════
  {
    name: "Déménagement, Nettoyage & Services",
    slug: "demenagement-nettoyage-services",
    iconName: "package",
    categories: [
      {
        name: "Déménagement",
        slug: "demenagement",
        ...MEDIUM,
        subCategories: [
          sc("Déménagement particulier", "demenagement-particulier"),
          sc("Déménagement entreprise", "demenagement-entreprise"),
        ],
      },
      {
        name: "Débarras",
        slug: "debarras",
        ...LIGHT,
        subCategories: [
          sc("Vide maison", "vide-maison"),
          sc("Vide grenier", "vide-grenier"),
          sc("Enlèvement encombrants", "enlevement-encombrants"),
        ],
      },
      {
        name: "Nettoyage",
        slug: "nettoyage",
        ...LIGHT,
        subCategories: [
          sc("Maison", "maison"),
          sc("Appartement", "appartement"),
          sc("Bureaux", "bureaux"),
          sc("Commerce", "commerce"),
          sc("Après chantier", "apres-chantier"),
          sc("Vitres", "vitres"),
          sc("Nettoyage toiture", "nettoyage-toiture"),
          sc("Nettoyage panneaux solaires", "nettoyage-panneaux-solaires"),
        ],
      },
    ],
  },

  // ═══ Univers 10 : Autre (wrapper, wizard-only) ═══════════════
  {
    name: "Autre",
    slug: "autre",
    iconName: "help-circle",
    categories: [
      {
        name: "Autre",
        slug: "autre",
        ...MEDIUM,
        isCatchAll: true,
        subCategories: [
          sc("Mon projet n'est pas dans la liste", "projet-non-liste"),
          sc("Demande multi-travaux (rénovation complète)", "multi-travaux"),
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
    key: "LEAD_GLOBAL_TIMEOUT_HOURS",
    value: "72",
    valueType: "int",
    // Sert aussi de fenêtre de réponse du pro : un assignment expire en même
    // temps que son lead (plus de délai court propre à l'assignment, cf.
    // lib/matching/assign.ts).
    description: "Délai global avant expiration définitive d'un lead.",
  },
  {
    key: "LEAD_SOUFFRANCE_HOURS",
    value: "24",
    valueType: "int",
    description:
      "Seuil (heures) avant qu'un lead actif sans acheteur soit considéré « en souffrance » (alerte admin, basé sur createdAt).",
  },
  {
    key: "SHARED_LEAD_MAX_ACCEPTANCES",
    value: "3",
    valueType: "int",
    description:
      "Nombre maximum de pros pouvant accepter un même lead partagé.",
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
          isCatchAll: catSeed.isCatchAll ?? false,
          displayOrder: c,
        },
        create: {
          universeId: universe.id,
          name: catSeed.name,
          slug: catSeed.slug,
          defaultSharedLeadPriceCents: catSeed.defaultSharedLeadPriceCents,
          defaultExclusiveLeadPriceCents:
            catSeed.defaultExclusiveLeadPriceCents,
          isCatchAll: catSeed.isCatchAll ?? false,
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
  // Admin principal (compte seede au premier db:seed). Toujours seede
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
        firstName: "Admin",
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
