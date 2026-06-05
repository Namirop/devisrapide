import type { Metadata } from "next";

import { ProHero } from "@/components/ds/pro/ProHero";
import { ProPotential } from "@/components/ds/pro/ProPotential";
import { ProComparison } from "@/components/ds/pro/ProComparison";
import { ProHowItWorks } from "@/components/ds/pro/ProHowItWorks";
import { ProNotifications } from "@/components/ds/pro/ProNotifications";
import { ProFAQ } from "@/components/ds/pro/ProFAQ";
import { ProFinalCTA } from "@/components/ds/pro/ProFinalCTA";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Artisans — Recevez des chantiers qualifiés — DevisRapide",
  description:
    "Plateforme belge de leads qualifiés pour artisans. Sans abonnement, payez uniquement ce que vous acceptez. 3 pros max par lead.",
};

export default async function ProsPage() {
  // Univers metiers (hors "Autre") = options "Je suis" du calculateur de
  // potentiel (ProPotential). La FAMILLE de metier (univers) est l'unite de
  // calcul, cf. potential-calculator.ts (METIER_DATA keye par slug d'univers).
  const universes = await prisma.universe.findMany({
    where: { slug: { not: "autre" } },
    orderBy: { displayOrder: "asc" },
    select: { slug: true, name: true },
  });

  return (
    // Coherent avec la LP particulier : grille technique restreinte au Hero
    // (signature visuelle de la zone d'impact), reste des sections sur fond
    // uni slate-50 commun.
    <div className="bg-slate-50">
      <ProHero />
      <ProPotential universes={universes} />
      <ProComparison />
      <ProHowItWorks />
      <ProNotifications />
      <ProFAQ />
      <ProFinalCTA />
    </div>
  );
}
