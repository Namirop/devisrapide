import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/layout/Sidebar";
import { TopBar } from "@/components/dashboard/layout/TopBar";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import type { ProValidationStatus } from "@prisma/client";

// Ou envoyer un pro dont le compte n'est pas (ou plus) validé.
const STATUS_REDIRECTS: Record<
  Exclude<ProValidationStatus, "VALIDATED">,
  string
> = {
  PENDING: "/inscription-pro/en-attente",
  REJECTED: "/compte-refuse",
  SUSPENDED: "/compte-suspendu",
};

/**
 * Layout dashboard pro. Server Component qui :
 *
 * 1. Recupere la session via auth() — le middleware (proxy.ts) a deja
 *    filtre les acces, mais on garde un double-check defensif au cas ou.
 * 2. Resoud le ProProfile une seule fois (companyName, email, firstName)
 *    et passe les donnees a la Sidebar et au TopBar via props, evitant
 *    les fetchs dupliques dans chaque enfant.
 * 3. Route selon le validationStatus lu EN BASE, et non celui du JWT : le
 *    jeton est fige a la connexion, donc une validation ou une suspension
 *    par l'admin ne doit pas attendre que le pro se reconnecte pour
 *    prendre effet (cf. commentaire du gate dashboard dans proxy.ts).
 * 4. Lit le pathname via header x-pathname (injecte par proxy.ts) pour
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
      validationStatus: true,
      user: { select: { email: true, firstName: true } },
    },
  });
  if (!profile) {
    redirect("/connexion");
  }
  if (profile.validationStatus !== "VALIDATED") {
    redirect(STATUS_REDIRECTS[profile.validationStatus]);
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
        <div className="flex-1 overflow-y-auto">
          {/* InstallPrompt porte son propre padding outer pour disparaitre
              entierement quand hidden (cf. composant). */}
          <InstallPrompt />
          {children}
        </div>
      </div>
      {/* Toaster sonner pour les feedbacks transverses (recharge
          wallet, flow accept/refuse, etc.). Position par
          defaut bottom-right. */}
      <Toaster richColors position="bottom-right" />
    </div>
  );
}
