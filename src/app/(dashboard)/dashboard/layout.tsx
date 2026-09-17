import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/layout/Sidebar";
import { TopBar } from "@/components/dashboard/layout/TopBar";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sessionResetUrl } from "@/lib/session-reset";

import type { ProValidationStatus } from "@prisma/client";

// Où envoyer un pro dont le compte n'est pas (ou plus) validé.
const STATUS_REDIRECTS: Record<
  Exclude<ProValidationStatus, "VALIDATED">,
  string
> = {
  PENDING: "/inscription-pro/en-attente",
  REJECTED: "/compte-refuse",
  SUSPENDED: "/compte-suspendu",
};

/**
 * Layout du dashboard pro. Revérifie la session malgré le filtrage de
 * proxy.ts et route selon le validationStatus lu en base, pas celui du JWT :
 * le jeton est figé à la connexion, une validation ou une suspension admin
 * doit prendre effet sans reconnexion. `x-pathname` (posé par proxy.ts)
 * active l'en-tête d'accueil du TopBar sur /dashboard.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.proProfileId) {
    redirect(sessionResetUrl("profil-manquant"));
  }

  const profile = await prisma.proProfile.findUnique({
    where: { id: session.user.proProfileId },
    select: {
      companyName: true,
      validationStatus: true,
      user: { select: { email: true, firstName: true } },
    },
  });
  // Jeton valide mais profil supprimé : rediriger vers /connexion bouclerait
  // (même cookie renvoyé vers /dashboard), on détruit donc la session.
  if (!profile) {
    redirect(sessionResetUrl("compte-supprime"));
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
          {/* InstallPrompt porte son propre padding pour disparaître
              entièrement quand il est masqué. */}
          <InstallPrompt />
          {children}
        </div>
      </div>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}
