import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Lock } from "@phosphor-icons/react/dist/ssr";

import { Logo } from "@/components/ds/Logo";
import { LaunchGateForm } from "@/components/launch/LaunchGateForm";
import {
  LAUNCH_COOKIE_NAME,
  isLaunchProtectEnabled,
  isSafeNext,
  isValidLaunchCookie,
} from "@/lib/launch-protect";
import { unlockLaunchGate } from "@/server/actions/launch-actions";

export const metadata: Metadata = {
  title: "Accès restreint",
  robots: { index: false, follow: false },
};

// Rendu à chaque requête : le verrou dépend d'une variable d'env runtime et
// du cookie. Sinon Next prérendrait une redirection statique vers "/" (le
// redirect précède cookies()), d'où une boucle / ↔ /acces verrou actif.
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function AccesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!isLaunchProtectEnabled()) redirect("/");

  const { next, error } = await searchParams;
  const safeNext = next && isSafeNext(next) ? next : "/";

  // Page exemptée du verrou : un visiteur déjà autorisé peut y atterrir.
  const cookie = (await cookies()).get(LAUNCH_COOKIE_NAME)?.value;
  if (await isValidLaunchCookie(cookie)) redirect(safeNext);

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center bg-slate-50 px-4 py-16">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern bg-fixed"
        aria-hidden
      />
      <div className="relative w-full max-w-[400px]">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <Logo variant="brand" size={44} href={null} />
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold uppercase tracking-[0.06em] text-slate-500">
            <Lock size={14} weight="bold" aria-hidden />
            Site en pré-lancement
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="font-display text-[22px] font-bold tracking-tight text-slate-900">
            Accès restreint
          </h1>
          <p className="mt-1.5 text-[14px] leading-relaxed text-slate-500">
            DevisRapide n&apos;est pas encore ouvert au public. Entrez vos
            identifiants d&apos;accès pour continuer.
          </p>

          <div className="mt-6">
            <LaunchGateForm
              action={unlockLaunchGate}
              next={safeNext}
              hasError={error === "1"}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
