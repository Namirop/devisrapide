import { startOfMonth, startOfPreviousMonth } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { computeDeltaPercent, type DeltaResult } from "@/lib/stats";

export type AdminHomeStats = {
  caMonthCents: number;
  caDelta: DeltaResult;
  walletGlobalCents: number;
  leadsMonthCount: number;
  leadsDelta: DeltaResult;
  souffranceLeadsCount: number;
};

/**
 * Stats globales pour la home admin Sprint 4. 4 metriques :
 *  - CA encaisse via Stripe ce mois (sum WalletTransaction TOPUP)
 *  - Wallet global (sum walletBalanceCents des pros VALIDATED) = "credits
 *    dormants" en attente d'usage
 *  - Demandes entrantes ce mois (count Lead du mois)
 *  - Leads en souffrance (count Lead PENDING_MATCH/ASSIGNED + matching
 *    commence depuis >2h + aucun ACCEPTED) — signal urgence sans delta
 *
 * Les deltas se comparent au mois precedent (mois entier vs mois entier
 * jusqu'a aujourd'hui meme date). Approximation V1 acceptable, pas de
 * comparaison "memes jours du mois" pour eviter complexite SQL.
 */
export async function getAdminHomeStats(): Promise<AdminHomeStats> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const prevMonthStart = startOfPreviousMonth(now);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  const [
    caMonthAgg,
    caPrevAgg,
    walletGlobalAgg,
    leadsMonthCount,
    leadsPrevCount,
    souffranceLeadsCount,
  ] = await Promise.all([
    prisma.walletTransaction.aggregate({
      where: { type: "TOPUP", createdAt: { gte: monthStart } },
      _sum: { amountCents: true },
    }),
    prisma.walletTransaction.aggregate({
      where: {
        type: "TOPUP",
        createdAt: { gte: prevMonthStart, lt: monthStart },
      },
      _sum: { amountCents: true },
    }),
    prisma.proProfile.aggregate({
      where: { validationStatus: "VALIDATED" },
      _sum: { walletBalanceCents: true },
    }),
    prisma.lead.count({
      where: { createdAt: { gte: monthStart }, deletedAt: null },
    }),
    prisma.lead.count({
      where: {
        createdAt: { gte: prevMonthStart, lt: monthStart },
        deletedAt: null,
      },
    }),
    prisma.lead.count({
      where: {
        status: { in: ["PENDING_MATCH", "ASSIGNED"] },
        matchingStartedAt: { lt: twoHoursAgo },
        deletedAt: null,
        assignments: { none: { status: "ACCEPTED" } },
      },
    }),
  ]);

  const caMonthCents = caMonthAgg._sum.amountCents ?? 0;
  const caPrevCents = caPrevAgg._sum.amountCents ?? 0;

  return {
    caMonthCents,
    caDelta: computeDeltaPercent(caMonthCents, caPrevCents),
    walletGlobalCents: walletGlobalAgg._sum.walletBalanceCents ?? 0,
    leadsMonthCount,
    leadsDelta: computeDeltaPercent(leadsMonthCount, leadsPrevCount),
    souffranceLeadsCount,
  };
}
