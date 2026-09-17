import { prisma } from "@/lib/prisma";
import {
  endOfPreviousMonth,
  startOfMonth,
  startOfPreviousMonth,
} from "@/lib/date";
import { computeDeltaPercent, type DeltaResult } from "@/lib/stats";

type CountWindow = { current: number; previous: number; delta: DeltaResult };

export type DashboardStats = {
  walletBalanceCents: number;
  accepted: CountWindow;
  converted: CountWindow;
  spentCents: { current: number; previous: number; delta: DeltaResult };
  conversionRate: number; // converted / accepted du mois (%), 0 si aucun achat
};

/**
 * Stats mensuelles des cartes du dashboard pro (mois courant vs précédent).
 * Le ProProfile est lu en premier : les agrégats WalletTransaction filtrent
 * sur son userId.
 */
export async function getDashboardStats(
  proProfileId: string,
): Promise<DashboardStats> {
  const profile = await prisma.proProfile.findUnique({
    where: { id: proProfileId },
    select: { walletBalanceCents: true, userId: true },
  });
  if (!profile) {
    return {
      walletBalanceCents: 0,
      accepted: { current: 0, previous: 0, delta: { kind: "none" } },
      converted: { current: 0, previous: 0, delta: { kind: "none" } },
      spentCents: { current: 0, previous: 0, delta: { kind: "none" } },
      conversionRate: 0,
    };
  }

  const now = new Date();
  const currentStart = startOfMonth(now);
  const previousStart = startOfPreviousMonth(now);
  const previousEnd = endOfPreviousMonth(now);

  const [
    acceptedCurrent,
    acceptedPrevious,
    convertedCurrent,
    convertedPrevious,
    spentCurrentAgg,
    spentPreviousAgg,
  ] = await Promise.all([
    prisma.leadAssignment.count({
      where: {
        proProfileId,
        status: "ACCEPTED",
        acceptedAt: { gte: currentStart },
      },
    }),
    prisma.leadAssignment.count({
      where: {
        proProfileId,
        status: "ACCEPTED",
        acceptedAt: { gte: previousStart, lt: previousEnd },
      },
    }),
    prisma.leadAssignment.count({
      where: {
        proProfileId,
        status: "ACCEPTED",
        followupStatus: "CONVERTED",
        acceptedAt: { gte: currentStart },
      },
    }),
    prisma.leadAssignment.count({
      where: {
        proProfileId,
        status: "ACCEPTED",
        followupStatus: "CONVERTED",
        acceptedAt: { gte: previousStart, lt: previousEnd },
      },
    }),
    prisma.walletTransaction.aggregate({
      where: {
        userId: profile.userId,
        type: "LEAD_DEBIT",
        createdAt: { gte: currentStart },
      },
      _sum: { amountCents: true },
    }),
    prisma.walletTransaction.aggregate({
      where: {
        userId: profile.userId,
        type: "LEAD_DEBIT",
        createdAt: { gte: previousStart, lt: previousEnd },
      },
      _sum: { amountCents: true },
    }),
  ]);

  const spentCurrent = spentCurrentAgg._sum.amountCents ?? 0;
  const spentPrevious = spentPreviousAgg._sum.amountCents ?? 0;

  const conversionRate =
    acceptedCurrent > 0
      ? Math.round((convertedCurrent / acceptedCurrent) * 100)
      : 0;

  return {
    walletBalanceCents: profile.walletBalanceCents,
    accepted: {
      current: acceptedCurrent,
      previous: acceptedPrevious,
      delta: computeDeltaPercent(acceptedCurrent, acceptedPrevious),
    },
    converted: {
      current: convertedCurrent,
      previous: convertedPrevious,
      delta: computeDeltaPercent(convertedCurrent, convertedPrevious),
    },
    spentCents: {
      current: spentCurrent,
      previous: spentPrevious,
      delta: computeDeltaPercent(spentCurrent, spentPrevious),
    },
    conversionRate,
  };
}
