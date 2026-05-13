import type { Metadata } from "next";

import { ProHero } from "@/components/ds/pro/ProHero";
import { ProPotential } from "@/components/ds/pro/ProPotential";
import { ProComparison } from "@/components/ds/pro/ProComparison";
import { ProHowItWorks } from "@/components/ds/pro/ProHowItWorks";
import { ProNotifications } from "@/components/ds/pro/ProNotifications";
import { ProTestimonials } from "@/components/ds/pro/ProTestimonials";
import { ProFAQ } from "@/components/ds/pro/ProFAQ";
import { ProFinalCTA } from "@/components/ds/pro/ProFinalCTA";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Artisans — Recevez des chantiers qualifiés — DevisRapide",
  description:
    "Plateforme belge de leads qualifiés pour artisans. Sans abonnement, payez uniquement ce que vous acceptez. 3 pros max par lead.",
};

export default async function ProsPage() {
  // Charge les categories Travaux pour le calculateur potentiel (etape 2 du
  // funnel pro inscription). On filtre les SOS (pas de prediction de volume).
  const travauxUniverse = await prisma.universe.findFirst({
    where: { slug: "travaux" },
    include: { categories: { orderBy: { displayOrder: "asc" } } },
  });
  const proCategories = travauxUniverse?.categories ?? [];

  return (
    // Coherent avec la LP particulier : grille technique restreinte au Hero
    // (signature visuelle de la zone d'impact), reste des sections sur fond
    // uni slate-50 commun. Fini l'alternance gris/blanc section-par-section.
    <div className="bg-slate-50">
      <ProHero />
      <ProPotential categories={proCategories} />
      <ProComparison />
      <ProHowItWorks />
      <ProNotifications />
      <ProTestimonials />
      <ProFAQ />
      <ProFinalCTA />
    </div>
  );
}
