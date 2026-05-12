import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Mail, MessageSquare } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { CONTACT } from "@/lib/contact";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Demande envoyée — DevisRapide",
  robots: { index: false, follow: false },
};

const NEXT_STEPS = [
  {
    Icon: Mail,
    title: "Email de confirmation",
    text: "Vous recevrez d'ici quelques minutes un récapitulatif de votre demande.",
  },
  {
    Icon: MessageSquare,
    title: "Pros qui vous contactent",
    text: "Les artisans intéressés vous appellent ou vous écrivent directement.",
  },
] as const;

export default function ConfirmationPage() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-4 py-16 sm:px-6 lg:py-24">
      <div
        className="grid h-16 w-16 place-items-center rounded-full"
        style={{ backgroundColor: "#dcfce7" }}
        aria-hidden
      >
        <CheckCircle2
          className="h-9 w-9"
          strokeWidth={2}
          style={{ color: "#16a34a" }}
        />
      </div>

      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900 lg:text-[34px]">
          Demande envoyée
        </h1>
        <p className="max-w-lg text-[15px] leading-relaxed text-slate-600">
          Nous recherchons les artisans les mieux placés dans votre secteur.
          Vous serez recontacté très rapidement.
        </p>
      </div>

      <div className="grid w-full gap-3 sm:grid-cols-2">
        {NEXT_STEPS.map((s) => (
          <div
            key={s.title}
            className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-[#1e3a8a]">
              <s.Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-[13.5px] font-semibold text-slate-900">
                {s.title}
              </span>
              <span className="text-[12.5px] leading-relaxed text-slate-500">
                {s.text}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "accent" }), "h-11 px-5 text-[14px] font-semibold")}
        >
          Retour à l&apos;accueil
        </Link>
        <Link
          href="/demande"
          className={cn(buttonVariants({ variant: "outline" }), "h-11 px-5 text-[14px]")}
        >
          Faire une autre demande
        </Link>
      </div>

      <div className="mt-2 text-center text-[12.5px] text-slate-500">
        Un problème&nbsp;? Contactez-nous à{" "}
        <a
          href={`mailto:${CONTACT.EMAIL}`}
          className="font-medium text-[#1e3a8a] underline-offset-2 hover:underline"
        >
          {CONTACT.EMAIL}
        </a>
      </div>
    </section>
  );
}
