/**
 * Sortie de secours pour un JWT encore valide mais incohérent avec la base :
 * rediriger vers /connexion ferait boucler les gates, il faut détruire le
 * cookie, ce qu'un Server Component ne peut pas faire pendant son rendu.
 * Volontairement sans import (chargé par proxy.ts).
 */

export const SESSION_RESET_PATH = "/api/deconnexion";

/** Motif journalisé côté serveur, pour le diagnostic uniquement. */
export type SessionResetReason =
  | "compte-supprime" // le ProProfile référencé par le jeton n'existe plus
  | "profil-manquant" // jeton PRO sans proProfileId
  | "role-inattendu" // rôle ni PRO ni ADMIN
  | "admin-supprime"; // le User ADMIN référencé n'existe plus

export function sessionResetUrl(reason: SessionResetReason): string {
  return `${SESSION_RESET_PATH}?raison=${reason}`;
}
