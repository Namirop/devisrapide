import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Warning } from "@phosphor-icons/react/dist/ssr";

import { AdminSidebar } from "@/components/admin/nav/AdminSidebar";
import { AdminTopBar } from "@/components/admin/nav/AdminTopBar";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/lib/auth";
import { isLeadCreationEnabled } from "@/lib/lead-creation-switch";
import { prisma } from "@/lib/prisma";
import { sessionResetUrl } from "@/lib/session-reset";

/**
 * Layout admin. Revérifie le rôle malgré le filtrage de proxy.ts (défense
 * en profondeur) et charge l'utilisateur une fois pour la sidebar et le
 * TopBar.
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

  // Lectures indépendantes en parallèle : ce layout s'exécute à chaque
  // navigation admin.
  const [user, leadCreationEnabled] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        firstName: true,
        proProfile: { select: { id: true } },
      },
    }),
    // Kill switch : bannière persistante sur toutes les pages admin.
    isLeadCreationEnabled(),
  ]);
  // Jeton valide mais User supprimé : le cookie continuerait à faire passer
  // son porteur pour un admin auprès du proxy, on détruit donc la session.
  if (!user) {
    redirect(sessionResetUrl("admin-supprime"));
  }

  const proProfileId = user.proProfile?.id ?? null;

  const pathname = (await headers()).get("x-pathname") ?? "";
  const isHome = pathname === "/admin";

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
