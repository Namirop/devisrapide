import type { Metadata } from "next";
import Link from "next/link";
import { SignOut, WarningOctagon } from "@phosphor-icons/react/dist/ssr";

import { buttonVariants } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { CONTACT } from "@/lib/contact";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Compte suspendu — DevisRapide",
  robots: { index: false, follow: false },
};

export default function CompteSuspenduPage() {
  return (
    <div className="relative flex flex-1 flex-col bg-slate-50">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern bg-fixed"
        aria-hidden
      />
      <section className="relative mx-auto my-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-10 sm:gap-7 sm:px-8 lg:py-16">
        <header className="flex flex-col items-start gap-3">
          <div className="inline-flex items-center gap-2 text-[#ea580c]">
            <WarningOctagon size={18} weight="bold" aria-hidden />
            <span className="text-[13px] font-semibold uppercase tracking-[0.05em]">
              Compte suspendu
            </span>
          </div>
          <h1 className="font-display text-[36px] font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-[40px] lg:text-[46px]">
            L&apos;accès à votre espace pro est désactivé.
          </h1>
          <p className="mt-1 max-w-xl text-[15px] leading-relaxed text-slate-600">
            Plusieurs raisons peuvent être à l&apos;origine de cette
            suspension : non-respect des CGU, plaintes répétées, ou demande
            d&apos;information administrative restée sans réponse. Notre
            équipe est à votre disposition pour clarifier la situation.
          </p>
        </header>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <a
            href={`mailto:${CONTACT.EMAIL}`}
            className={cn(
              buttonVariants({ variant: "accent" }),
              "h-12 w-full px-6 text-[15px] font-semibold sm:w-auto",
            )}
          >
            Contacter le support
          </a>
          {/* Le pro arrive ici via redirect middleware -> il est connecte.
              On lui offre de se deconnecter explicitement. */}
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
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 w-full px-6 text-[15px] sm:w-auto",
            )}
          >
            Retour à l&apos;accueil
          </Link>
        </div>

        <div className="text-[12.5px] leading-relaxed text-slate-500">
          Vous pouvez aussi nous écrire à{" "}
          <a
            href={`mailto:${CONTACT.EMAIL}`}
            className="font-medium text-[#1e3a8a] underline-offset-2 hover:underline"
          >
            {CONTACT.EMAIL}
          </a>{" "}
          en précisant votre numéro de TVA et la nature de votre demande.
        </div>
      </section>
    </div>
  );
}
