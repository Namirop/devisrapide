import type { Metadata } from "next";

import { ProSignupWizard } from "@/components/pro-signup/ProSignupWizard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Devenir artisan — DevisRapide",
  description:
    "Inscription gratuite sur la plateforme N°1 en Belgique pour les artisans. Recevez des leads qualifiés sans abonnement.",
};

export default async function InscriptionProPage() {
  const universes = await prisma.universe.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    include: {
      categories: {
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  return (
    // Meme strategie visuelle que /demande : page bg-slate-50 + grille
    // sur les zones vides, wizard englobe dans une card centrale qui
    // porte ses propres box-shadows "stack of papers".
    <div className="relative flex flex-1 flex-col bg-slate-50">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern bg-fixed"
        aria-hidden
      />
      <section className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6 lg:py-10">
        <ProSignupWizard universes={universes} />
      </section>
    </div>
  );
}
