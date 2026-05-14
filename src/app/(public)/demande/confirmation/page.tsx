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

// TODO(v2): remplacer l'eyebrow "DEMANDE ENVOYÉE" par "DEMANDE #{lead.id}"
// quand createLead retournera l'ID public au client (Sprint 2+).
// Pour le moment on garde un eyebrow sans numéro pour éviter d'afficher un
// faux ID qui changerait au refresh.

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
      <section className="relative mx-auto flex max-w-2xl flex-col gap-10 px-4 py-16 sm:px-6 lg:py-24">
      <header className="flex flex-col items-start gap-3">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: "#ea580c" }}
        >
          Demande envoyée
        </span>
        <h1 className="font-display text-[34px] font-bold leading-[1.1] tracking-tight text-slate-900 lg:text-[42px]">
          Merci, votre demande est partie.
        </h1>
        <p className="mt-1 max-w-xl text-[15.5px] leading-relaxed text-slate-600">
          Nous recherchons les artisans les mieux placés dans votre secteur.
          Vous serez recontacté très rapidement.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {NEXT_STEPS.map((s) => (
          <div
            key={s.title}
            className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-5"
          >
            <s.Icon
              size={20}
              weight="regular"
              className="text-slate-700"
              aria-hidden
            />
            <span className="mt-1 text-[14px] font-semibold text-slate-900">
              {s.title}
            </span>
            <span className="text-[13px] leading-relaxed text-slate-500">
              {s.text}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "accent" }),
            "h-12 px-6 text-[15px] font-semibold",
          )}
        >
          Retour à l&apos;accueil
        </Link>
        <Link
          href="/demande"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-12 px-6 text-[15px]",
          )}
        >
          Faire une autre demande
        </Link>
      </div>

      <div className="text-[12.5px] text-slate-500">
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
