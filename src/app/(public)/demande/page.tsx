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
    // Chaine flex-1 / flex-col : main (flex-col flex-1) → wrapper → section
    // → form. Permet au form du wizard de remplir l'espace vertical entre
    // Header et Footer DS et de placer ses nav buttons en bas naturellement
    // via mt-auto, sans laisser de zone vide sur grand ecran.
    <div className="relative flex flex-1 flex-col">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern"
        aria-hidden
      />
      <section className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 sm:px-6">
        <LeadFormWizard
          catalogue={catalogue}
          initialUniverseId={initialUniverse?.id ?? null}
          initialCategoryId={initialCategory?.id ?? null}
        />
      </section>
    </div>
  );
}
