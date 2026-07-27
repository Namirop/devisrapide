import { startOfMonth, startOfPreviousMonth } from "@/lib/date";
import { getLeadSouffranceHours } from "@/lib/lead-delays";
import { prisma } from "@/lib/prisma";
import { computeDeltaPercent, type DeltaResult } from "@/lib/stats";

export type AdminHomeStats = {
  caMonthCents: number;
  caDelta: DeltaResult;
  walletGlobalCents: number;
  leadsMonthCount: number;
  leadsDelta: DeltaResult;
  souffranceLeadsCount: number;
  souffranceHours: number;
};

/**
 * Stats globales pour la home admin. 4 metriques :
 *  - CA encaisse via Stripe ce mois : somme des TOPUP **hors bonus offert**.
 *    Le bonus est du credit maison, jamais encaisse — l'inclure gonflait le
 *    CA. amountCents = paye + bonus, d'ou la soustraction de bonusCents
 *    (NULL sur les recharges anterieures au tracking du bonus : elles n'en
 *    avaient pas, on garde leur montant tel quel).
 *  - Wallet global (sum walletBalanceCents des pros VALIDATED) = "credits
 *    dormants" en attente d'usage
 *  - Demandes entrantes ce mois (count Lead du mois)
 *  - Leads en souffrance : meme definition que l'onglet /admin/leads
 *    (LEAD_SOUFFRANCE_HOURS sur createdAt, aucun ACCEPTED) pour que la tuile
 *    et la liste juste en dessous ne racontent pas deux choses differentes
 *
 * Les deltas se comparent au mois precedent (mois entier vs mois entier
 * jusqu'a aujourd'hui meme date). Approximation V1 acceptable, pas de
 * comparaison "memes jours du mois" pour eviter complexite SQL.
 */
export async function getAdminHomeStats(): Promise<AdminHomeStats> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const prevMonthStart = startOfPreviousMonth(now);
  const souffranceHours = await getLeadSouffranceHours();
  const souffranceCutoff = new Date(
    now.getTime() - souffranceHours * 60 * 60 * 1000,
  );

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
      _sum: { amountCents: true, bonusCents: true },
    }),
    prisma.walletTransaction.aggregate({
      where: {
        type: "TOPUP",
        createdAt: { gte: prevMonthStart, lt: monthStart },
      },
      _sum: { amountCents: true, bonusCents: true },
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
        createdAt: { lt: souffranceCutoff },
        deletedAt: null,
        assignments: { none: { status: "ACCEPTED" } },
      },
    }),
  ]);

  const caMonthCents =
    (caMonthAgg._sum.amountCents ?? 0) - (caMonthAgg._sum.bonusCents ?? 0);
  const caPrevCents =
    (caPrevAgg._sum.amountCents ?? 0) - (caPrevAgg._sum.bonusCents ?? 0);

  return {
    caMonthCents,
    caDelta: computeDeltaPercent(caMonthCents, caPrevCents),
    walletGlobalCents: walletGlobalAgg._sum.walletBalanceCents ?? 0,
    leadsMonthCount,
    leadsDelta: computeDeltaPercent(leadsMonthCount, leadsPrevCount),
    souffranceLeadsCount,
    souffranceHours,
  };
}
