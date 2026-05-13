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
    <section className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-16 sm:px-6 lg:py-24">
      <header className="flex flex-col items-start gap-3">
        <WarningOctagon
          size={32}
          weight="regular"
          className="text-rose-500"
          aria-hidden
        />
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-500">
          Compte suspendu
        </span>
        <h1 className="font-display text-[32px] font-bold leading-[1.1] tracking-tight text-slate-900 lg:text-[40px]">
          L&apos;accès à votre espace pro est désactivé.
        </h1>
        <p className="mt-1 max-w-xl text-[15.5px] leading-relaxed text-slate-600">
          Plusieurs raisons peuvent être à l&apos;origine de cette
          suspension : non-respect des CGU, plaintes répétées, ou demande
          d&apos;information administrative restée sans réponse. Notre équipe
          est à votre disposition pour clarifier la situation.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={`mailto:${CONTACT.EMAIL}`}
          className={cn(
            buttonVariants({ variant: "accent" }),
            "h-12 px-6 text-[15px] font-semibold",
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
        >
          <button
            type="submit"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 gap-2 px-6 text-[15px]",
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
            "h-12 px-6 text-[15px]",
          )}
        >
          Retour à l&apos;accueil
        </Link>
      </div>

      <div className="text-[12.5px] text-slate-500">
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
  );
}
