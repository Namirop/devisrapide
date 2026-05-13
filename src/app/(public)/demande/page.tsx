import type { Metadata } from "next";

import { LeadFormWizard } from "@/components/client-form/LeadFormWizard";
import { getCatalogueTree } from "@/server/queries/catalogue";

export const metadata: Metadata = {
  title: "Demander un devis — DevisRapide",
  description:
    "Décrivez votre projet en quelques étapes, nous trouvons les artisans disponibles en Belgique.",
};

// Resolution server-side du universe pre-selectionne via querystring.
// Le slug "urgence-services" doit etre matche pour rendre le badge SOS sans
// flash (cf. Step1Universe SOS_UNIVERSE_SLUG).
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
      {/* Grille pattern globale, garde le bg texture sur les zones
          vides de chaque cote du wizard (visibles surtout sur grand
          ecran 2K+). La card du wizard masque la grille en son centre. */}
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern bg-fixed"
        aria-hidden
      />
      <section className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6 lg:py-10">
        {/* Effet "stack of papers" : 2 cards fantomes derriere la card
            active, decalees vers le bas-droite pour suggerer une pile de
            feuilles (metaphore "6 pages a remplir"). Hidden sur mobile
            (peu de place horizontale, l'effet etait charge visuellement). */}
        <div className="relative flex flex-1 flex-col">
          <div
            className="pointer-events-none absolute inset-0 hidden translate-x-3 translate-y-3 rounded-2xl border border-slate-200 bg-white sm:block"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 hidden translate-x-1.5 translate-y-1.5 rounded-2xl border border-slate-200 bg-white sm:block"
            aria-hidden
          />
          {/* Card du dessus (visible) qui porte le wizard actif. */}
          <div className="relative flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <LeadFormWizard
              catalogue={catalogue}
              initialUniverseId={initialUniverse?.id ?? null}
              initialCategoryId={initialCategory?.id ?? null}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
