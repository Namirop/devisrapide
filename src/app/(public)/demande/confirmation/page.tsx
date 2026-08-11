import type { Metadata } from "next";
import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import {
  ChatCircle,
  Clock,
  Envelope,
} from "@phosphor-icons/react/dist/ssr";

import { buttonVariants } from "@/components/ui/button";
import { CONTACT } from "@/lib/contact";
import { cn } from "@/lib/utils";

// Eyebrow sans numéro de demande : createLead ne renvoie pas d'ID public au
// client, et afficher un identifiant qui changerait au refresh serait pire
// que pas d'identifiant du tout.

export const metadata: Metadata = {
  title: "Demande envoyée — DevisRapide",
  robots: { index: false, follow: false },
};

const NEXT_STEPS: ReadonlyArray<{
  Icon: Icon;
  title: string;
  text: string;
}> = [
  {
    Icon: Envelope,
    title: "Email de confirmation",
    text: "Vous recevez d'ici quelques minutes un récapitulatif détaillé de votre demande.",
  },
  {
    Icon: ChatCircle,
    title: "Pros qui vous contactent",
    text: "Les artisans intéressés vous appellent ou vous écrivent directement.",
  },
  {
    Icon: Clock,
    title: "Délai de réponse moyen",
    text: "Sous 4 heures en moyenne, du lundi au vendredi.",
  },
];

export default function ConfirmationPage() {
  return (
    <div className="relative flex flex-1 flex-col bg-slate-50">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern bg-fixed"
        aria-hidden
      />
      <section className="relative mx-auto my-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-10 sm:gap-7 sm:px-8 lg:py-16">
      <header className="flex flex-col items-start gap-2.5">
        <span
          className="text-[13px] font-semibold uppercase tracking-[0.05em]"
          style={{ color: "#ea580c" }}
        >
          Demande envoyée
        </span>
        <h1 className="font-display text-[36px] font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-[40px] lg:text-[46px]">
          Merci, votre demande est partie.
        </h1>
        <p className="mt-1 max-w-xl text-[15px] leading-relaxed text-slate-600">
          Nous recherchons les artisans les mieux placés dans votre secteur.
          Vous serez recontacté très rapidement.
        </p>
      </header>

      {/* Mobile : cards en row (icone badge a gauche, contenu a droite),
          plus compactes. Desktop (sm+) : revient en colonnes 3-up avec icone
          au-dessus du contenu. sm:contents sur le wrapper interne permet a
          ses enfants de devenir freres directs de l'icone dans le flex-col
          desktop, pour que le gap parent s'applique uniformement. */}
      <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
        {NEXT_STEPS.map((s) => (
          <div
            key={s.title}
            className="flex items-start gap-3.5 rounded-md border border-slate-200 bg-white p-4 sm:flex-col sm:gap-2 sm:p-5"
          >
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-blue-50 text-[#1e3a8a] sm:h-9 sm:w-9"
              aria-hidden
            >
              <s.Icon size={20} weight="regular" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5 sm:contents">
              <span className="text-[14px] font-semibold leading-snug text-slate-900 sm:mt-1">
                {s.title}
              </span>
              <span className="text-[13px] leading-relaxed text-slate-500">
                {s.text}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "accent" }),
            "h-12 w-full px-6 text-[15px] font-semibold sm:w-auto",
          )}
        >
          Retour à l&apos;accueil
        </Link>
        <Link
          href="/demande"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-12 w-full px-6 text-[15px] sm:w-auto",
          )}
        >
          Faire une autre demande
        </Link>
      </div>

      <div className="text-[12.5px] leading-relaxed text-slate-500">
        Un problème&nbsp;? Contactez-nous à{" "}
        <a
          href={`mailto:${CONTACT.EMAIL}`}
          className="font-medium text-[#1e3a8a] underline-offset-2 hover:underline"
        >
          {CONTACT.EMAIL}
        </a>
        .
      </div>
      </section>
    </div>
  );
}
