import { SITE_URL } from "@/lib/site-url";

import type { LeadUrgency } from "@prisma/client";

/**
 * Convertit un enum LeadUrgency en libelle humain pour les emails.
 * Aligne sur les labels affiches dans le wizard Step 4 (cohersion UX).
 */
export function urgencyLabel(urgency: LeadUrgency): string {
  switch (urgency) {
    case "URGENT":
      return "Urgent — sous 24-48h";
    case "SOON":
      return "Bientôt — dans la semaine";
    case "PLANNED":
      return "Planifié — dans le mois";
    case "FLEXIBLE":
      return "Flexible — pas de date imposée";
  }
}

/**
 * Construit l'URL absolue vers la vue d'un lead dans le dashboard pro.
 * Route cible : /dashboard/leads/[id].
 */
export function buildProAssignmentUrl(assignmentId: string): string {
  return `${getAppBaseUrl()}/dashboard/leads/${assignmentId}`;
}

/**
 * Construit l'URL absolue vers la home du dashboard pro.
 */
export function buildProDashboardUrl(): string {
  return `${getAppBaseUrl()}/dashboard`;
}

/**
 * Construit l'URL absolue vers la page de detail d'un lead accepte
 * dans /dashboard/mes-demandes/[id] (vue post-acceptation avec
 * coordonnees client visibles + qualification).
 */
export function buildProMesDemandesUrl(assignmentId: string): string {
  return `${getAppBaseUrl()}/dashboard/mes-demandes/${assignmentId}`;
}

/**
 * Construit l'URL absolue vers la page wallet du pro (recharge + solde).
 */
export function buildWalletUrl(): string {
  return `${getAppBaseUrl()}/dashboard/wallet`;
}

/**
 * Construit l'URL absolue vers la fiche d'un pro dans le panel admin
 * (route /admin/professionnels/[id]), ou se fait la validation.
 */
export function buildAdminProReviewUrl(proProfileId: string): string {
  return `${getAppBaseUrl()}/admin/professionnels/${proProfileId}`;
}

/**
 * Construit l'URL absolue vers la page de reinitialisation de mot de passe
 * a partir du token de reset (route /reinitialiser-mot-de-passe/[token]).
 */
export function buildPasswordResetUrl(token: string): string {
  return `${getAppBaseUrl()}/reinitialiser-mot-de-passe/${token}`;
}

function getAppBaseUrl(): string {
  return SITE_URL;
}
