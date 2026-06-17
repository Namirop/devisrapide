import type { Metadata } from "next";

import { KillSwitchControl } from "@/components/admin/configuration/KillSwitchControl";
import { requireAdminSession } from "@/lib/auth-guards";
import { isLeadCreationEnabled } from "@/lib/lead-creation-switch";

export const metadata: Metadata = {
  title: "Configuration — Admin",
  robots: { index: false, follow: false },
};

// Lecture sans cache du kill switch → rendu à chaque requête.
export const dynamic = "force-dynamic";

export default async function AdminConfigurationPage() {
  await requireAdminSession();
  const leadCreationEnabled = await isLeadCreationEnabled();

  return (
    <main className="px-5 pt-4 pb-6 sm:px-10 sm:pt-5 sm:pb-8">
      <header className="mb-8">
        <h1 className="font-display text-[28px] font-bold tracking-tight text-slate-900 lg:text-[34px]">
          Configuration
        </h1>
        <p className="mt-1 text-[14.5px] text-slate-600">
          Réglages globaux de la plateforme. Actions sensibles protégées par
          mot de passe.
        </p>
      </header>

      <section className="max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-display text-[18px] font-bold text-slate-900">
          Création de demandes (kill switch)
        </h2>
        <p className="mt-1 mb-5 text-[13px] leading-relaxed text-slate-600">
          Suspend temporairement la réception de nouvelles demandes client (en
          cas de spam ou d&apos;incident). Les professionnels et l&apos;admin
          continuent de fonctionner normalement.
        </p>
        <KillSwitchControl enabled={leadCreationEnabled} />
      </section>
    </main>
  );
}
