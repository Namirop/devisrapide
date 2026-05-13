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
 * Sprint 2a : la route /pro/leads/[id] n'existe pas encore (Sprint 2b),
 * mais le lien est emis en email avec la forme correcte pour eviter
 * un re-deploiement des templates.
 */
export function buildProAssignmentUrl(assignmentId: string): string {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base}/pro/leads/${assignmentId}`;
}
