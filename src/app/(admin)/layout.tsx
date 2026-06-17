import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Warning } from "@phosphor-icons/react/dist/ssr";

import { AdminSidebar } from "@/components/admin/nav/AdminSidebar";
import { AdminTopBar } from "@/components/admin/nav/AdminTopBar";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/lib/auth";
import { isLeadCreationEnabled } from "@/lib/lead-creation-switch";
import { prisma } from "@/lib/prisma";

/**
 * Layout admin (Sprint 4). Server Component qui :
 *
 * 1. Verifie session via auth() — le middleware proxy.ts filtre deja
 *    les non-admins (Sprint 4 commit C4), double-check defensif au cas
 *    ou un appel direct contournerait le middleware.
 * 2. Resoud le User (email, firstName, proProfile.id optionnel) pour
 *    passer aux composants Sidebar / TopBar sans re-fetch.
 *
 * Layout : flex horizontal pleine hauteur. Sidebar charcoal fixe gauche
 * (lg+), main column avec TopBar compacte + zone scrollable pleine
 * largeur. Pas de panneau widgets droite (contrairement au dashboard
 * pro home).
 *
 * Toaster sonner mount pour les feedbacks d'action admin (validate /
 * reject / suspend / etc.).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      firstName: true,
      proProfile: { select: { id: true } },
    },
  });
  if (!user) {
    redirect("/");
  }

  const proProfileId = user.proProfile?.id ?? null;

  const pathname = (await headers()).get("x-pathname") ?? "";
  const isHome = pathname === "/admin";

  // Kill switch (Sprint C) : bannière d'alerte persistante quand la création
  // de demandes est suspendue, visible sur toutes les pages admin.
  const leadCreationEnabled = await isLeadCreationEnabled();

  return (
    <div className="flex h-screen bg-slate-50">
      <AdminSidebar proProfileId={proProfileId} email={user.email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar
          email={user.email}
          firstName={user.firstName}
          proProfileId={proProfileId}
          greeting={
            isHome
              ? {
                  firstName: user.firstName?.trim() || "",
                  subtitle: "Voici l'activité de DevisRapide en temps réel.",
                }
              : undefined
          }
        />
        {!leadCreationEnabled && (
          <div className="flex items-center gap-2.5 border-b border-rose-200 bg-rose-600 px-5 py-2.5 text-white sm:px-10">
            <Warning size={18} weight="fill" className="shrink-0" aria-hidden />
            <p className="text-[13px] font-semibold">
              ATTENTION : création de leads DÉSACTIVÉE — les nouvelles
              demandes client sont refusées.{" "}
              <a href="/admin/configuration" className="underline underline-offset-2">
                Réactiver
              </a>
            </p>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}
