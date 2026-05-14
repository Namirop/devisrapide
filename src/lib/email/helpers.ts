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
 * Route cible : /dashboard/leads/[id] (Sprint 2b).
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

function getAppBaseUrl(): string {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}
