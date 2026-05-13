import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Layout dashboard pro. Server Component qui :
 *
 * 1. Recupere la session via auth() — le middleware (proxy.ts) a deja
 *    filtre les acces, mais on garde un double-check defensif au cas ou.
 * 2. Resoud le ProProfile une seule fois (companyName, email) et passe
 *    les donnees a la Sidebar et au TopBar via props, evitant les
 *    fetchs dupliques dans chaque enfant.
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
      user: { select: { email: true } },
    },
  });
  if (!profile) {
    redirect("/connexion");
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar proProfileId={session.user.proProfileId} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          companyName={profile.companyName}
          email={profile.user.email}
          proProfileId={session.user.proProfileId}
        />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
