import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/nav/AdminSidebar";
import { AdminTopBar } from "@/components/admin/nav/AdminTopBar";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/lib/auth";
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
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}
