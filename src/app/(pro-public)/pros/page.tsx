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
  // Univers (hors « Autre ») proposés par le calculateur de potentiel : ses
  // données sont indexées par slug d'univers (cf. potential-calculator.ts).
  const universes = await prisma.universe.findMany({
    where: { slug: { not: "autre" } },
    orderBy: { displayOrder: "asc" },
    select: { slug: true, name: true },
  });

  return (
    // Comme la landing particulier : grille décorative réservée au Hero,
    // fond uni pour le reste.
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
