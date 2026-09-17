import { SITE_URL } from "@/lib/site-url";

import type { LeadUrgency } from "@prisma/client";

/** Libellé d'urgence, cohérent avec l'étape 2 du formulaire client. */
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

// URLs absolues pour les emails (les liens doivent fonctionner hors du site).

/** Lead proposé au pro (avant achat). */
export function buildProAssignmentUrl(assignmentId: string): string {
  return `${getAppBaseUrl()}/dashboard/leads/${assignmentId}`;
}

export function buildProDashboardUrl(): string {
  return `${getAppBaseUrl()}/dashboard`;
}

/** Lead acheté : coordonnées du client et suivi. */
export function buildProMesDemandesUrl(assignmentId: string): string {
  return `${getAppBaseUrl()}/dashboard/mes-demandes/${assignmentId}`;
}

export function buildWalletUrl(): string {
  return `${getAppBaseUrl()}/dashboard/wallet`;
}

export function buildAdminProReviewUrl(proProfileId: string): string {
  return `${getAppBaseUrl()}/admin/professionnels/${proProfileId}`;
}

export function buildPasswordResetUrl(token: string): string {
  return `${getAppBaseUrl()}/reinitialiser-mot-de-passe/${token}`;
}

function getAppBaseUrl(): string {
  return SITE_URL;
}
