import type { Metadata } from "next";

import { LeadFormWizard } from "@/components/client-form/LeadFormWizard";
import { getCatalogueTree } from "@/server/queries/catalogue";

export const metadata: Metadata = {
  title: "Demander un devis — DevisRapide",
  description:
    "Décrivez votre projet en quelques étapes, nous trouvons les artisans disponibles en Belgique.",
};

// Resolution server-side du universe pre-selectionne via querystring.
// Le slug "sos-depannage" doit etre matche pour rendre le badge SOS sans flash.
type SearchParams = Promise<{
  universe?: string | string[];
  category?: string | string[];
}>;

export default async function DemandePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const catalogue = await getCatalogueTree();
  const sp = await searchParams;

  const universeSlug = Array.isArray(sp.universe) ? sp.universe[0] : sp.universe;
  const categorySlug = Array.isArray(sp.category) ? sp.category[0] : sp.category;

  const initialUniverse = universeSlug
    ? catalogue.find((u) => u.slug === universeSlug)
    : undefined;
  const initialCategory = initialUniverse && categorySlug
    ? initialUniverse.categories.find((c) => c.slug === categorySlug)
    : undefined;

  const initialSosMode = initialUniverse?.slug === "sos-depannage";

  return (
    <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
      <LeadFormWizard
        catalogue={catalogue}
        initialUniverseId={initialUniverse?.id ?? null}
        initialCategoryId={initialCategory?.id ?? null}
        initialSosMode={initialSosMode}
      />
    </section>
  );
}
