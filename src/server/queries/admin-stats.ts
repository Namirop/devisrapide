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
 * Stats de la home admin. Le CA du mois exclut les bonus offerts (crédit
 * jamais encaissé : amountCents − bonusCents, bonus NULL compté 0). Les leads
 * en souffrance suivent la même définition que l'onglet /admin/leads.
 * Limite connue : les deltas comparent le mois en cours, à date, au mois
 * précédent complet.
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
