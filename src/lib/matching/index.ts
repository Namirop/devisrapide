import { getAppConfig } from "@/lib/config";
import { prisma } from "@/lib/prisma";

import { assignLeadToPros } from "./assign";
import { findMatchingPros } from "./find-pros";

/**
 * Entree principale du matching, appelee depuis la Server Action
 * `createLead` apres l'ecriture initiale du Lead.
 *
 * Premiere passe seulement (palier 0). Les paliers suivants et le timeout
 * global (`LEAD_GLOBAL_TIMEOUT_HOURS`, 72h par defaut) sont declenches par
 * le cron Vercel `/api/cron/process-leads`.
 *
 * Lit `RADIUS_PALIERS_KM` depuis AppConfig pour determiner le rayon initial.
 * Si la config est absente ou cassee, fallback `30`.
 *
 * **Pas idempotent** : l'update de `matchingStartedAt` est inconditionnel et
 * remet `currentRadiusKm` au palier initial. Un second appel sur un lead
 * deja matche redemarrerait donc son horloge d'elargissement et le
 * ramenerait a 30 km. Sans consequence aujourd'hui (seul `createLead`
 * appelle cette fonction, une fois), mais toute action « relancer le
 * matching » devra d'abord rendre cet update conditionnel.
 */
export async function matchLead(leadId: string): Promise<void> {
  const radiusPaliers = await getAppConfig("RADIUS_PALIERS_KM", "json");
  const initialRadius = Array.isArray(radiusPaliers)
    ? Number(radiusPaliers[0]) || 30
    : 30;

  // Marque le debut du matching pour que le cron sache calculer les
  // paliers d'elargissement (matchingStartedAt + ZONE_EXPANSION_DELAYS_MIN).
  // Pose AVANT la recherche de pros : si la suite echoue, le cron ramasse
  // quand meme le lead au palier suivant.
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      matchingStartedAt: new Date(),
      currentRadiusKm: initialRadius,
    },
  });

  const pros = await findMatchingPros({ leadId, radiusKm: initialRadius });
  if (pros.length === 0) {
    // Aucun pro au palier 0 — le cron tentera d'elargir au palier 1 puis
    // OPEN avant le timeout global.
    return;
  }

  await assignLeadToPros({ leadId, pros, radiusKm: initialRadius });
}
