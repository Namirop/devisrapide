import type { Metadata } from "next";
import Link from "next/link";
import { SignOut, XCircle } from "@phosphor-icons/react/dist/ssr";

import { buttonVariants } from "@/components/ui/button";
import { signOut, auth } from "@/lib/auth";
import { CONTACT } from "@/lib/contact";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Candidature non retenue — DevisRapide",
  robots: { index: false, follow: false },
};

// Page d'atterrissage pour les pros dont la candidature a ete refusee
// (validationStatus = REJECTED). Distincte de /compte-suspendu (SUSPENDED)
// car le message est definitif et non remediable cote pro, contrairement
// a une suspension qui peut etre clarifiee.
export default async function CompteRefusePage() {
  // Recupere la raison du refus pour la rendre visible (transparence +
  // permet au pro de savoir si une nouvelle candidature corrigeant le
  // motif aurait du sens).
  const session = await auth();
  const proProfileId = session?.user.proProfileId;
  const rejectedReason = proProfileId
    ? (
        await prisma.proProfile.findUnique({
          where: { id: proProfileId },
          select: { rejectedReason: true },
        })
      )?.rejectedReason ?? null
    : null;

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-16 sm:px-6 lg:py-24">
      <header className="flex flex-col items-start gap-3">
        <XCircle
          size={32}
          weight="regular"
          className="text-slate-500"
          aria-hidden
        />
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Candidature non retenue
        </span>
        <h1 className="font-display text-[32px] font-bold leading-[1.1] tracking-tight text-slate-900 lg:text-[40px]">
          Votre candidature n&apos;a pas été retenue.
        </h1>
        <p className="mt-1 max-w-xl text-[15.5px] leading-relaxed text-slate-600">
          Après examen de votre dossier, notre équipe n&apos;a pas pu donner
          suite à votre demande d&apos;inscription en tant que professionnel
          sur DevisRapide.
        </p>
      </header>

      {rejectedReason && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
            Motif communiqué
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-slate-700">
            {rejectedReason}
          </p>
        </div>
      )}

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
        Si vous estimez que le motif n&apos;est plus d&apos;actualité (dossier
        désormais complet, situation régularisée), écrivez à{" "}
        <a
          href={`mailto:${CONTACT.EMAIL}`}
          className="font-medium text-[#1e3a8a] underline-offset-2 hover:underline"
        >
          {CONTACT.EMAIL}
        </a>{" "}
        en joignant les pièces justificatives.
      </div>
    </section>
  );
}
