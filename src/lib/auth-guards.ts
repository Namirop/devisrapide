import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Erreur typee levee par les guards d'auth. Tous les call-sites doivent
 * la propager : c'est le pattern explicite "ne pas continuer en silence".
 *
 * Le middleware proxy.ts filtre deja l'acces aux routes /dashboard/* avant
 * que le code Server Component ne s'execute, donc en pratique on ne
 * devrait jamais throw ici sur un GET de page. C'est pour les Server
 * Actions et appels secondaires ou la garantie middleware ne s'applique
 * pas (POST direct sur une action, page non-protegee qui appelle l'action,
 * etc.).
 */
export class UnauthorizedError extends Error {
  constructor(public readonly reason: string) {
    super(`Unauthorized: ${reason}`);
    this.name = "UnauthorizedError";
  }
}

/**
 * Garde principale pour les Server Components et Server Actions du
 * dashboard pro. Verifie :
 *
 * 1. Session existe.
 * 2. role === "PRO".
 * 3. proProfileId est non null (sinon le pro n'a pas de profil persiste,
 *    cas transitoire improbable mais explicite).
 * 4. validationStatus === "VALIDATED", lu EN BASE et non dans la session :
 *    le JWT est fige a la connexion, donc une suspension prononcee par
 *    l'admin ne prenait effet qu'a la reconnexion du pro — qui pouvait
 *    entre-temps continuer a acheter des leads. Symetriquement, une
 *    validation prend effet immediatement.
 *
 * Throw `UnauthorizedError` au moindre echec — pas de retour null. Les
 * consommateurs en aval peuvent ainsi destructurer sans null-check :
 *
 *   const { userId, proProfileId } = await requireProSession();
 *   // proProfileId est garanti string ici.
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
 * A appeler en tete des pages qui annoncent un compte pro non actif
 * (/inscription-pro/en-attente, /compte-suspendu, /compte-refuse).
 *
 * Ces pages restent accessibles sans session : on arrive sur "en attente"
 * juste apres l'inscription, avant meme d'avoir un compte utilisable. Mais
 * un pro connecte dont le compte a change de statut entre-temps ne doit pas
 * rester devant un ecran perime — c'est le cas du pro qui recoit l'email
 * "votre compte est valide" alors que son onglet est encore ouvert sur la
 * page d'attente.
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
 * Garde principale pour les Server Components et Server Actions du panel
 * admin (/admin/*). Verifie :
 *
 * 1. Session existe.
 * 2. role === "ADMIN".
 *
 * Throw `UnauthorizedError` au moindre echec. Defense en profondeur : le
 * middleware proxy.ts redirige deja les non-admins, ce guard couvre les
 * cas hors flux GET (Server Actions appelees depuis client) ou un appel
 * direct contournerait le middleware.
 *
 * Retourne uniquement le userId : un admin n'a pas de proProfileId (le
 * cas usuel). Si on a besoin de l'email cote action
 * pour logger, on relookup via prisma.user dans l'action.
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
