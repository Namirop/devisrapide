import { getAppConfig } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import {
  WalletInsufficientFundsError,
  debitWalletForLead,
} from "@/lib/wallet/debit";

import type { MatchablePro } from "./find-pros";

/**
 * Crée les `LeadAssignment` pour les pros matches sur un lead. Sprint 2a.
 *
 * Pour chaque pro fourni :
 * 1. Verifie le lock : si le lead a deja atteint le max d'acceptations
 *    (1 si exclusif, sinon `SHARED_LEAD_MAX_ACCEPTANCES`), STOP et
 *    n'assigne plus.
 * 2. Cree un `LeadAssignment` en PENDING avec `priceCents` (selon
 *    `lead.isExclusive`), `radiusKmAtAssignment`, et `expiresAt = now +
 *    RESPONSE_DELAY_MINUTES`.
 * 3. Si le pro a `autoAccept = true` ET un wallet suffisant :
 *    - Bascule l'assignment en ACCEPTED dans une transaction
 *      Serializable.
 *    - Debit le wallet via `debitWalletForLead`.
 *    - Si l'auto-accept echoue (wallet finalement insuffisant a cause
 *      d'une concurrence), l'assignment reste en PENDING (le pro pourra
 *      l'accepter manuellement apres recharge).
 *
 * Les emails (nouveau lead pour PENDING, lead accepte pour ACCEPTED)
 * seront branches au commit 12. Pour l'instant : TODO inline.
 *
 * @param input.leadId    id du Lead a assigner
 * @param input.pros      liste des pros matches (cf. `findMatchingPros`)
 * @param input.radiusKm  rayon utilise pour cette passe (-1 pour OPEN)
 * @returns               nombre d'assignments crees (utile pour le caller)
 */
export async function assignLeadToPros(input: {
  leadId: string;
  pros: MatchablePro[];
  radiusKm: number;
}): Promise<number> {
  const { leadId, pros, radiusKm } = input;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      isExclusive: true,
      sharedLeadPriceCentsSnapshot: true,
      exclusiveLeadPriceCentsSnapshot: true,
    },
  });
  if (!lead) throw new Error(`Lead introuvable: ${leadId}`);

  const priceCents = lead.isExclusive
    ? lead.exclusiveLeadPriceCentsSnapshot
    : lead.sharedLeadPriceCentsSnapshot;

  const maxAcceptances = lead.isExclusive
    ? 1
    : await getAppConfig("SHARED_LEAD_MAX_ACCEPTANCES", "int");
  const responseDelayMin = await getAppConfig("RESPONSE_DELAY_MINUTES", "int");

  let created = 0;

  for (const pro of pros) {
    // ── Lock cap : recompter a chaque iteration pour reagir aux
    // acceptations qui auraient eu lieu pendant cette passe (auto-accept
    // ou acceptation manuelle externe). Pas de race au sein de cette
    // boucle (sequentielle), mais protege des passes paralleles (cron).
    const acceptedCount = await prisma.leadAssignment.count({
      where: { leadId, status: "ACCEPTED" },
    });
    if (acceptedCount >= maxAcceptances) {
      break;
    }

    const expiresAt = new Date(Date.now() + responseDelayMin * 60 * 1000);
    const shouldAutoAccept =
      pro.autoAccept && pro.walletBalanceCents >= priceCents;

    if (shouldAutoAccept) {
      // ── Auto-accept : assignment ACCEPTED + debit wallet en une
      // transaction Serializable. Si le wallet est concurremment vide
      // (autre acceptation simultanee), on attrape l'erreur et on
      // retombe en PENDING.
      try {
        await prisma.$transaction(
          async (tx) => {
            const assignment = await tx.leadAssignment.create({
              data: {
                leadId,
                proProfileId: pro.id,
                proUserId: pro.userId,
                priceCents,
                isExclusive: lead.isExclusive,
                radiusKmAtAssignment: radiusKm,
                status: "ACCEPTED",
                acceptedAt: new Date(),
                expiresAt,
              },
              select: { id: true },
            });
            await debitWalletForLead({
              tx,
              proProfileId: pro.id,
              proUserId: pro.userId,
              amountCents: priceCents,
              leadAssignmentId: assignment.id,
              description: "Auto-accept lead",
            });
          },
          { isolationLevel: "Serializable" },
        );
        created++;
        // TODO commit 12 : sendLeadAcceptedProEmail(pro, lead)
      } catch (err) {
        if (err instanceof WalletInsufficientFundsError) {
          // Fallback PENDING : le pro pourra accepter apres recharge.
          await prisma.leadAssignment.create({
            data: {
              leadId,
              proProfileId: pro.id,
              proUserId: pro.userId,
              priceCents,
              isExclusive: lead.isExclusive,
              radiusKmAtAssignment: radiusKm,
              status: "PENDING",
              expiresAt,
            },
          });
          created++;
          // TODO commit 12 : sendNewLeadProEmail(pro, lead)
        } else {
          throw err;
        }
      }
    } else {
      // ── PENDING simple.
      await prisma.leadAssignment.create({
        data: {
          leadId,
          proProfileId: pro.id,
          proUserId: pro.userId,
          priceCents,
          isExclusive: lead.isExclusive,
          radiusKmAtAssignment: radiusKm,
          status: "PENDING",
          expiresAt,
        },
      });
      created++;
      // TODO commit 12 : sendNewLeadProEmail(pro, lead)
    }

    await prisma.proProfile.update({
      where: { id: pro.id },
      data: { lastLeadReceivedAt: new Date() },
    });
  }

  if (created > 0) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { matchAttempts: { increment: created } },
    });
  }

  return created;
}
