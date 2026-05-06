import type { Metadata } from "next";

import { LeadFormWizard } from "@/components/client-form/LeadFormWizard";
import { getCatalogueTree } from "@/server/queries/catalogue";

export const metadata: Metadata = {
  title: "Demander un devis — DevisRapide",
  description:
    "Décrivez votre projet en quelques étapes, nous trouvons les artisans disponibles dans votre secteur.",
};

export default async function DemandePage() {
  const catalogue = await getCatalogueTree();

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <LeadFormWizard catalogue={catalogue} />
    </section>
  );
}
