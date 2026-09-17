import type { Metadata } from "next";
import { Wrench } from "@phosphor-icons/react/dist/ssr";

import { LeadFormWizard } from "@/components/client-form/LeadFormWizard";
import { isLeadCreationEnabled } from "@/lib/lead-creation-switch";
import { getCatalogueTree } from "@/server/queries/catalogue";

export const metadata: Metadata = {
  title: "Demander un devis — DevisRapide",
  description:
    "Décrivez votre projet en quelques étapes, nous trouvons les artisans disponibles en Belgique.",
};

// Univers et catégorie présélectionnés par querystring, résolus côté serveur
// pour rendre le badge SOS sans flash (cf. SOS_UNIVERSE_SLUG, Step1Project).
type SearchParams = Promise<{
  universe?: string | string[];
  category?: string | string[];
}>;

export default async function DemandePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Kill switch : message au lieu du formulaire ; createLead refuse aussi
  // côté serveur (défense en profondeur).
  if (!(await isLeadCreationEnabled())) {
    return <ServiceUnavailable />;
  }

  const catalogue = await getCatalogueTree();
  const sp = await searchParams;

  const universeSlug = Array.isArray(sp.universe)
    ? sp.universe[0]
    : sp.universe;
  const categorySlug = Array.isArray(sp.category)
    ? sp.category[0]
    : sp.category;

  const initialUniverse = universeSlug
    ? catalogue.find((u) => u.slug === universeSlug)
    : undefined;
  const initialCategory =
    initialUniverse && categorySlug
      ? initialUniverse.categories.find((c) => c.slug === categorySlug)
      : undefined;

  return (
    // Chaîne flex-1 / flex-col jusqu'au formulaire : le wizard remplit la
    // hauteur entre Header et Footer et ses boutons se calent en bas (mt-auto).
    <div className="relative flex flex-1 flex-col bg-slate-50">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern bg-fixed"
        aria-hidden
      />
      <section className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 lg:py-10">
        <LeadFormWizard
          catalogue={catalogue}
          initialUniverseId={initialUniverse?.id ?? null}
          initialCategoryId={initialCategory?.id ?? null}
        />
      </section>
    </div>
  );
}

/** Kill switch actif : indisponibilité temporaire, sans détail technique. */
function ServiceUnavailable() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center bg-slate-50 px-4 py-16">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern bg-fixed"
        aria-hidden
      />
      <div className="relative w-full max-w-[440px] rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-9">
        <span
          className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-amber-50"
          aria-hidden
        >
          <Wrench size={24} weight="regular" className="text-amber-600" />
        </span>
        <h1 className="font-display text-[22px] font-bold tracking-tight text-slate-900">
          Demandes momentanément en pause
        </h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-slate-600">
          Le service est temporairement indisponible. Nous reprenons les
          demandes très bientôt — merci de revenir dans quelques instants.
        </p>
      </div>
    </div>
  );
}
