import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Layout dashboard pro. Server Component qui :
 *
 * 1. Recupere la session via auth() — le middleware (proxy.ts) a deja
 *    filtre les acces, mais on garde un double-check defensif au cas ou.
 * 2. Resoud le ProProfile une seule fois (companyName, email, firstName)
 *    et passe les donnees a la Sidebar et au TopBar via props, evitant
 *    les fetchs dupliques dans chaque enfant.
 * 3. Lit le pathname via header x-pathname (injecte par proxy.ts) pour
 *    decider du mode TopBar : "greeting" sur /dashboard (home) avec le
 *    "Bonjour {prenom}" + sous-titre, "compact" partout ailleurs.
 *
 * Layout : flex horizontal pleine hauteur ecran. Sidebar fixe gauche (lg+),
 * main column avec TopBar sticky + zone scrollable.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.proProfileId) {
    redirect("/connexion");
  }

  const profile = await prisma.proProfile.findUnique({
    where: { id: session.user.proProfileId },
    select: {
      companyName: true,
      user: { select: { email: true, firstName: true } },
    },
  });
  if (!profile) {
    redirect("/connexion");
  }

  const pathname = (await headers()).get("x-pathname") ?? "";
  const isHome = pathname === "/dashboard";

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar proProfileId={session.user.proProfileId} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          companyName={profile.companyName}
          email={profile.user.email}
          proProfileId={session.user.proProfileId}
          greeting={
            isHome
              ? {
                  firstName: profile.user.firstName?.trim() || "",
                  subtitle: "Voici un aperçu de votre activité aujourd'hui.",
                }
              : undefined
          }
        />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
      {/* Toaster sonner pour les feedbacks transverses (Sprint 3 recharge
          wallet, futurs flow accept/refuse Sprint 3, etc.). Position par
          defaut bottom-right. */}
      <Toaster richColors position="bottom-right" />
    </div>
  );
}
