import { getAppConfig } from "@/lib/config";
import { prisma } from "@/lib/prisma";

import { assignLeadToPros } from "./assign";
import { findMatchingPros } from "./find-pros";

/**
 * Première passe du matching (palier 0), appelée une fois par `createLead`.
 * Les paliers suivants et l'expiration relèvent du cron `process-leads`.
 * Non idempotent : un second appel réinitialiserait l'horloge
 * d'élargissement et le rayon du lead.
 */
export async function matchLead(leadId: string): Promise<void> {
  const radiusPaliers = await getAppConfig("RADIUS_PALIERS_KM", "json");
  const initialRadius = Array.isArray(radiusPaliers)
    ? Number(radiusPaliers[0]) || 30
    : 30;

  // Posé avant la recherche : si la suite échoue, le cron reprend quand même
  // le lead au palier suivant.
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      matchingStartedAt: new Date(),
      currentRadiusKm: initialRadius,
    },
  });

  const pros = await findMatchingPros({ leadId, radiusKm: initialRadius });
  if (pros.length === 0) {
    return;
  }

  await assignLeadToPros({ leadId, pros, radiusKm: initialRadius });
}
