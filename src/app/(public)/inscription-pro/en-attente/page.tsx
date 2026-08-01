import type { Metadata } from "next";
import Link from "next/link";
import { Hourglass, SignOut } from "@phosphor-icons/react/dist/ssr";

import { buttonVariants } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { redirectIfProValidated } from "@/lib/auth-guards";
import { CONTACT } from "@/lib/contact";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Candidature reçue — DevisRapide",
  robots: { index: false, follow: false },
};

export default async function InscriptionProEnAttentePage() {
  await redirectIfProValidated();

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center bg-slate-50">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern bg-fixed"
        aria-hidden
      />
      <section className="relative mx-auto my-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-10 sm:gap-7 sm:px-8 lg:py-16">
        <header className="flex flex-col items-start gap-3">
          <div className="inline-flex items-center gap-2 text-[#ea580c]">
            <Hourglass size={18} weight="bold" aria-hidden />
            <span className="text-[13px] font-semibold uppercase tracking-[0.05em]">
              Candidature soumise
            </span>
          </div>
          <h1 className="font-display text-[36px] font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-[40px] lg:text-[46px]">
            Votre candidature est en cours de validation.
          </h1>
          <p className="mt-1 max-w-xl text-[15px] leading-relaxed text-slate-600">
            Notre équipe vérifie vos informations (numéro de TVA, métiers,
            zone) et vous recontacte par email dès la validation. Délai moyen
            : 24 heures ouvrables.
          </p>
        </header>

        {/* Mobile : cards en row (badge step a gauche, contenu a droite),
            plus compactes. Desktop (sm+) : revient en colonnes 3-up avec
            badge step au-dessus du contenu. sm:contents sur le wrapper
            interne permet a ses enfants de devenir freres directs du badge
            dans le flex-col desktop. */}
        <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
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

        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          {/* Le pro arrive ici via redirect middleware -> il est connecte.
              "Se deconnecter" est donc le CTA pertinent (pas "Se connecter"). */}
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "accent" }),
              "h-12 w-full px-6 text-[15px] font-semibold sm:w-auto",
            )}
          >
            Retour à l&apos;accueil
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
            className="w-full sm:w-auto"
          >
            <button
              type="submit"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-12 w-full gap-2 px-6 text-[15px] sm:w-auto",
              )}
            >
              <SignOut size={16} weight="regular" aria-hidden />
              Se déconnecter
            </button>
          </form>
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
    <div className="flex items-start gap-3.5 rounded-md border border-slate-200 bg-white p-4 sm:flex-col sm:gap-2 sm:p-5">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-50 text-[14px] font-semibold text-[#1e3a8a] sm:h-9 sm:w-9 sm:text-[13px]"
        aria-hidden
      >
        {step}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5 sm:contents">
        <span className="text-[14px] font-semibold leading-snug text-slate-900 sm:mt-1">
          {title}
        </span>
        <span className="text-[13px] leading-relaxed text-slate-500">
          {text}
        </span>
      </div>
    </div>
  );
}
