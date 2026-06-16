import Link from "next/link";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Logo } from "@/components/ds/Logo";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Réinitialiser le mot de passe — DevisRapide",
};

export default async function ReinitialiserMotDePassePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: { used: true, expiresAt: true },
  });
  const isValid = !!record && !record.used && record.expiresAt > new Date();

  return (
    <div className="relative flex flex-1 flex-col bg-slate-50">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern bg-fixed"
        aria-hidden
      />
      <section className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:py-16">
        <div className="flex flex-col items-center text-center">
          <Logo variant="brand" size={44} href="/" />
          <span className="mt-5 text-[13px] font-semibold uppercase tracking-[0.05em] text-slate-500">
            Espace artisan
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {isValid ? (
            <>
              <h1 className="font-display text-[24px] font-bold tracking-tight text-slate-900">
                Choisissez un nouveau mot de passe
              </h1>
              <p className="mt-1.5 text-[14px] leading-relaxed text-slate-500">
                Il remplacera votre ancien mot de passe. Vous pourrez ensuite
                vous reconnecter avec.
              </p>
              <div className="mt-6">
                <ResetPasswordForm token={token} />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <WarningCircle size={36} weight="fill" className="text-rose-500" />
              <h1 className="font-display text-[22px] font-bold tracking-tight text-slate-900">
                Lien invalide ou expiré
              </h1>
              <p className="text-[14px] leading-relaxed text-slate-500">
                Ce lien de réinitialisation n&apos;est plus valable (déjà
                utilisé ou expiré après 1 heure). Refaites une demande pour en
                recevoir un nouveau.
              </p>
              <Link
                href="/mot-de-passe-oublie"
                className="mt-2 text-[13.5px] font-medium text-[#1e3a8a] underline-offset-2 hover:underline"
              >
                Refaire une demande
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
