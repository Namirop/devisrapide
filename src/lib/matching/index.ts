import { getAppConfig } from "@/lib/config";
import { prisma } from "@/lib/prisma";

import { assignLeadToPros } from "./assign";
import { findMatchingPros } from "./find-pros";

/**
 * Entree principale du matching, appelee depuis la Server Action
 * `createLead` apres l'ecriture initiale du Lead.
 *
 * Premiere passe seulement (palier 0) — les paliers 2 et 3 ainsi que le
 * timeout 24h sont declenches par le cron Vercel `/api/cron/process-leads`
 * (cf. commits 9-10).
 *
 * Lit `RADIUS_PALIERS_KM` depuis AppConfig pour determiner le rayon initial.
 * Si la config est absente ou cassee, fallback `30`.
 *
 * Idempotent : `matchingStartedAt` est ecrit en INSERT-only ; un appel
 * concurrent verrait juste un Lead deja matche et n'ecraserait pas la
 * date initiale.
 */
export async function matchLead(leadId: string): Promise<void> {
  const radiusPaliers = await getAppConfig("RADIUS_PALIERS_KM", "json");
  const initialRadius = Array.isArray(radiusPaliers)
    ? Number(radiusPaliers[0]) || 30
    : 30;

  // Marque le debut du matching pour que le cron sache calculer les
  // paliers d'elargissement (matchingStartedAt + 2h, +4h, +24h).
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
    // OPEN avant de timeout (24h).
    return;
  }

  await assignLeadToPros({ leadId, pros, radiusKm: initialRadius });
}
