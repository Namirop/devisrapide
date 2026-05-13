import type { Metadata } from "next";
import Link from "next/link";
import { Hourglass, LogOut } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { CONTACT } from "@/lib/contact";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Candidature reçue — DevisRapide",
  robots: { index: false, follow: false },
};

export default function InscriptionProEnAttentePage() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-10 px-4 py-16 sm:px-6 lg:py-24">
      <header className="flex flex-col items-start gap-3">
        <Hourglass
          className="h-8 w-8 text-[#ea580c]"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ea580c]">
          Candidature soumise
        </span>
        <h1 className="text-[34px] font-bold leading-[1.1] tracking-tight text-slate-900 lg:text-[42px]">
          Votre candidature est en cours de validation.
        </h1>
        <p className="mt-1 max-w-xl text-[15.5px] leading-relaxed text-slate-600">
          Notre équipe vérifie vos informations (numéro de TVA, métiers,
          zone) et vous recontacte par email dès la validation. Délai moyen :
          24 heures ouvrables.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <NextStepCard
          step="1"
          title="Vérification documents"
          text="Notre équipe contrôle votre numéro de TVA et la cohérence des informations."
        />
        <NextStepCard
          step="2"
          title="Email de validation"
          text="Vous recevez un email dès que votre compte est activé."
        />
        <NextStepCard
          step="3"
          title="Premier lead"
          text="Rechargez votre wallet et activez vos alertes pour recevoir vos premières demandes."
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Le pro arrive ici via redirect middleware -> il est connecte.
            "Se deconnecter" est donc le CTA pertinent (pas "Se connecter"). */}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 gap-2 px-6 text-[15px]",
            )}
          >
            <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden />
            Se déconnecter
          </button>
        </form>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "accent" }),
            "h-12 px-6 text-[15px] font-semibold",
          )}
        >
          Retour à l&apos;accueil
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
  );
}

function NextStepCard({
  step,
  title,
  text,
}: {
  step: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-5">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[12px] font-semibold text-slate-600">
        {step}
      </span>
      <span className="mt-1 text-[14px] font-semibold text-slate-900">
        {title}
      </span>
      <span className="text-[13px] leading-relaxed text-slate-500">{text}</span>
    </div>
  );
}
