import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Levée par les guards d'auth, à propager. `proxy.ts` filtre déjà les pages ;
 * les guards couvrent ce qu'il ne voit pas (Server Action appelée en POST
 * direct, action déclenchée depuis une page publique).
 */
export class UnauthorizedError extends Error {
  constructor(public readonly reason: string) {
    super(`Unauthorized: ${reason}`);
    this.name = "UnauthorizedError";
  }
}

/**
 * Guard du dashboard pro : session PRO avec profil `VALIDATED`, sinon
 * `UnauthorizedError`. Le statut est lu en base et non dans le JWT, figé à
 * la connexion : une suspension admin s'applique ainsi immédiatement.
 */
export async function requireProSession(): Promise<{
  userId: string;
  proProfileId: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError("No session");
  }
  if (session.user.role !== "PRO") {
    throw new UnauthorizedError("Not a PRO account");
  }
  if (!session.user.proProfileId) {
    throw new UnauthorizedError("Pro profile missing");
  }
  const profile = await prisma.proProfile.findUnique({
    where: { id: session.user.proProfileId },
    select: { validationStatus: true },
  });
  if (!profile) {
    throw new UnauthorizedError("Pro profile missing");
  }
  if (profile.validationStatus !== "VALIDATED") {
    throw new UnauthorizedError(
      `Pro account not validated (status=${profile.validationStatus})`,
    );
  }
  return {
    userId: session.user.id,
    proProfileId: session.user.proProfileId,
  };
}

/**
 * Pour les pages de compte pro non actif (en attente, suspendu, refusé),
 * accessibles sans session : renvoie vers le dashboard un pro connecté
 * validé entre-temps plutôt que de le laisser sur un écran périmé.
 */
export async function redirectIfProValidated(): Promise<void> {
  const session = await auth();
  const proProfileId = session?.user?.proProfileId;
  if (!proProfileId) return;

  const profile = await prisma.proProfile.findUnique({
    where: { id: proProfileId },
    select: { validationStatus: true },
  });
  if (profile?.validationStatus === "VALIDATED") {
    redirect("/dashboard");
  }
}

/**
 * Guard du panel admin : session ADMIN, sinon `UnauthorizedError`. Défense
 * en profondeur derrière `proxy.ts`, indispensable pour les Server Actions.
 */
export async function requireAdminSession(): Promise<{
  userId: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError("No session");
  }
  if (session.user.role !== "ADMIN") {
    throw new UnauthorizedError("Not an ADMIN account");
  }
  return {
    userId: session.user.id,
  };
}
