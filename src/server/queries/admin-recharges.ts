import { prisma } from "@/lib/prisma";

// Récap des recharges (TOPUP) d'un pro sur une période, pour les factures
// B2B manuelles mensuelles. Montant PAYÉ (hors bonus) =
// amountPaidCents ; total crédité = amountCents ; bonus = bonusCents.
// Les colonnes paid/bonus sont NULL sur les recharges antérieures
// (affichage "—", exclues du total payé).

export type RechargeRow = {
  id: string;
  createdAt: Date;
  amountCreditedCents: number;
  amountPaidCents: number | null;
  bonusCents: number | null;
  stripePaymentIntentId: string | null;
};

export type ProRechargesResult = {
  rows: RechargeRow[];
  totalPaidCents: number;
  hasMissingPaid: boolean;
};

export async function listProsForSelect(): Promise<
  Array<{ id: string; companyName: string }>
> {
  return prisma.proProfile.findMany({
    orderBy: { companyName: "asc" },
    select: { id: true, companyName: true },
  });
}

export async function getProRechargesForPeriod(input: {
  proProfileId: string;
  start: Date;
  endExclusive: Date;
}): Promise<ProRechargesResult | null> {
  const pro = await prisma.proProfile.findUnique({
    where: { id: input.proProfileId },
    select: { userId: true },
  });
  if (!pro) return null;

  const txs = await prisma.walletTransaction.findMany({
    where: {
      userId: pro.userId,
      type: "TOPUP",
      createdAt: { gte: input.start, lt: input.endExclusive },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      amountCents: true,
      amountPaidCents: true,
      bonusCents: true,
      stripePaymentIntentId: true,
    },
  });

  let totalPaidCents = 0;
  let hasMissingPaid = false;
  const rows: RechargeRow[] = txs.map((t) => {
    if (t.amountPaidCents === null) {
      hasMissingPaid = true;
    } else {
      totalPaidCents += t.amountPaidCents;
    }
    return {
      id: t.id,
      createdAt: t.createdAt,
      amountCreditedCents: t.amountCents,
      amountPaidCents: t.amountPaidCents,
      bonusCents: t.bonusCents,
      stripePaymentIntentId: t.stripePaymentIntentId,
    };
  });

  return { rows, totalPaidCents, hasMissingPaid };
}
