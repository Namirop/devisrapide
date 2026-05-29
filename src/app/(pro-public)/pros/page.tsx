import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Wrench } from "@phosphor-icons/react/dist/ssr";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Page temporairement remplacee pendant la refonte. La version complete est
// conservee dans `_archive/page-full.tsx` (dossier `_` non route par Next.js)
// et sera restauree une fois la refonte terminee. On garde l'URL /pros active
// pour ne pas casser les liens entrants.

export const metadata: Metadata = {
  title: "Espace artisans — Bientôt disponible — DevisRapide",
  description:
    "Notre espace dédié aux artisans est en cours de refonte. Revenez très bientôt pour découvrir la nouvelle expérience.",
  robots: { index: false, follow: true },
};

export default function ProsPage() {
  return (
    <section className="relative flex flex-1 items-center justify-center overflow-hidden bg-white px-6 py-20">
      {/* Meme signature visuelle que la LP : fond blanc + grille technique. */}
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex max-w-[560px] flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
          <Wrench size={28} weight="duotone" aria-hidden />
        </span>

        <span className="mt-6 text-[13px] font-semibold uppercase tracking-[0.05em] text-orange-600">
          Page en construction
        </span>

        <h1 className="font-display mt-3 text-[32px] font-bold leading-[1.1] tracking-tight text-slate-900 lg:text-[40px]">
          Notre espace artisans fait peau neuve
        </h1>

        <p className="mt-5 text-[15.5px] leading-relaxed text-slate-600">
          Nous finalisons une nouvelle expérience pour les pros&nbsp;: présentation
          claire du modèle, simulateur de potentiel et inscription simplifiée.
          La page sera de retour très bientôt.
        </p>

        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "default" }),
            "mt-8 h-12 gap-2 px-6 text-[15px] font-semibold",
          )}
        >
          <ArrowLeft size={16} weight="bold" aria-hidden />
          Retour à l&apos;accueil
        </Link>

        <p className="mt-6 text-[12px] text-slate-500">
          Vous êtes artisan et souhaitez être prévenu du lancement&nbsp;?
          Écrivez-nous à{" "}
          <a
            href="mailto:contact@devisrapide.be"
            className="font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
          >
            contact@devisrapide.be
          </a>
          .
        </p>
      </div>
    </section>
  );
}
