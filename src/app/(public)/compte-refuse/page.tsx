import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
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
  const profile = proProfileId
    ? await prisma.proProfile.findUnique({
        where: { id: proProfileId },
        select: { rejectedReason: true, validationStatus: true },
      })
    : null;

  // Statut lu en base et non dans la session : un pro reactive par l'admin
  // pendant que cette page est ouverte ne doit pas rester devant un ecran
  // de refus perime (le JWT, lui, est fige jusqu'a la reconnexion).
  if (profile?.validationStatus === "VALIDATED") {
    redirect("/dashboard");
  }
  const rejectedReason = profile?.rejectedReason ?? null;

  return (
    <div className="relative flex flex-1 flex-col bg-slate-50">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern bg-fixed"
        aria-hidden
      />
      <section className="relative mx-auto my-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-10 sm:gap-7 sm:px-8 lg:py-16">
        <header className="flex flex-col items-start gap-3">
          <div className="inline-flex items-center gap-2 text-[#ea580c]">
            <XCircle size={18} weight="bold" aria-hidden />
            <span className="text-[13px] font-semibold uppercase tracking-[0.05em]">
              Candidature non retenue
            </span>
          </div>
          <h1 className="font-display text-[36px] font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-[40px] lg:text-[46px]">
            Votre candidature n&apos;a pas été retenue.
          </h1>
          <p className="mt-1 max-w-xl text-[15px] leading-relaxed text-slate-600">
            Après examen de votre dossier, notre équipe n&apos;a pas pu donner
            suite à votre demande d&apos;inscription en tant que professionnel
            sur DevisRapide.
          </p>
        </header>

        {rejectedReason && (
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500">
              Motif communiqué
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-700">
              {rejectedReason}
            </p>
          </div>
        )}

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
          Si vous estimez que le motif n&apos;est plus d&apos;actualité
          (dossier désormais complet, situation régularisée), écrivez à{" "}
          <a
            href={`mailto:${CONTACT.EMAIL}`}
            className="font-medium text-[#1e3a8a] underline-offset-2 hover:underline"
          >
            {CONTACT.EMAIL}
          </a>{" "}
          en joignant les pièces justificatives.
        </div>
      </section>
    </div>
  );
}
