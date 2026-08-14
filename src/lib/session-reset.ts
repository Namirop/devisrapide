/**
 * Sortie de secours pour une session JWT devenue incoherente avec la base.
 *
 * Le jeton est signe pour 30 jours et n'est jamais revalide en base (choix
 * assume, cf. auth.config.ts). Un compte supprime laisse donc derriere lui
 * un cookie parfaitement valide qui pretend etre un PRO existant.
 *
 * Historiquement les gates renvoyaient ce cookie fantome vers /connexion,
 * qui le renvoyait vers /dashboard, qui le renvoyait vers /connexion... a
 * l'infini (le navigateur ne montrait qu'un scintillement). Le seul moyen
 * de sortir de la boucle est de DETRUIRE le cookie, ce qu'un Server
 * Component ne peut pas faire pendant son rendu — d'ou cette route.
 *
 * Ce module ne contient volontairement aucun import : il est lu depuis
 * proxy.ts, qui tourne en Edge runtime.
 */

export const SESSION_RESET_PATH = "/api/deconnexion";

/**
 * Motif de la destruction, propage en query et logge cote serveur. Sert
 * uniquement au diagnostic dans les logs Vercel : l'utilisateur, lui, voit
 * toujours le meme message sur /connexion.
 */
export type SessionResetReason =
  | "compte-supprime" // le ProProfile reference par le jeton n'existe plus
  | "profil-manquant" // jeton PRO sans proProfileId
  | "role-inattendu" // jeton dont le role n'est ni PRO ni ADMIN
  | "admin-supprime"; // le User ADMIN reference par le jeton n'existe plus

export function sessionResetUrl(reason: SessionResetReason): string {
  return `${SESSION_RESET_PATH}?raison=${reason}`;
}
