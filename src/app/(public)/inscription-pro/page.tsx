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
    <div className="relative h-full">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern"
        aria-hidden
      />
      <section className="relative mx-auto flex h-full max-w-3xl flex-col px-4 pb-2 pt-6 sm:px-6 lg:pb-0 lg:pt-8">
        <ProSignupWizard universes={universes} />
      </section>
    </div>
  );
}
