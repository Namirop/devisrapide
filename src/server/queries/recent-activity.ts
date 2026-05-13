import {
  ArrowDownCircle,
  CheckCircle2,
  Sparkles,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

export type ActivityItem = {
  id: string;
  at: Date;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  label: string;
  /** Suffixe optionnel (montant, etc.) place en fin de ligne. */
  trailing?: string;
};

/**
 * Merge des LeadAssignment + WalletTransaction du pro en un fil
 * d'activite trie par date desc (LIMIT 10). Chaque item a un label
 * lisible selon son type :
 *
 *   - "Lead acheté : <Cat> à <Ville>" (ACCEPTED manuel)
 *   - "Auto-accept : <Cat> à <Ville>" (ACCEPTED via auto-accept)
 *   - "Lead refusé : <Cat>" (REFUSED)
 *   - "Wallet débité : -X €" (LEAD_DEBIT)
 *   - "Wallet rechargé : +X €" (TOPUP, V1 pas declenche)
 *   - "Crédit admin : +X €" (ADMIN_CREDIT)
 */
export async function getRecentActivity(input: {
  proProfileId: string;
  userId: string;
  limit?: number;
}): Promise<ActivityItem[]> {
  const { proProfileId, userId, limit = 10 } = input;

  // On fetch 2x limit chaque cote pour s'assurer d'avoir assez d'items
  // post-merge meme si l'un des cotes est tres dense.
  const [assignments, txs] = await Promise.all([
    prisma.leadAssignment.findMany({
      where: { proProfileId },
      orderBy: [
        { acceptedAt: "desc" },
        { refusedAt: "desc" },
        { notifiedAt: "desc" },
      ],
      take: limit * 2,
      select: {
        id: true,
        status: true,
        acceptedAt: true,
        refusedAt: true,
        notifiedAt: true,
        walletTransactionId: true,
        lead: {
          select: {
            city: true,
            subCategory: {
              select: { category: { select: { name: true } } },
            },
          },
        },
      },
    }),
    prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit * 2,
      select: {
        id: true,
        type: true,
        amountCents: true,
        createdAt: true,
        leadAssignmentId: true,
      },
    }),
  ]);

  const items: ActivityItem[] = [];

  for (const a of assignments) {
    // Date pivot = acceptedAt si ACCEPTED, refusedAt si REFUSED,
    // notifiedAt sinon (PENDING ou EXPIRED).
    const at = a.acceptedAt ?? a.refusedAt ?? a.notifiedAt;
    const categoryName = a.lead.subCategory.category.name;
    const city = a.lead.city;

    if (a.status === "ACCEPTED") {
      // Differencier auto-accept (assignment.acceptedAt = assignment.notifiedAt)
      // d'une acceptation manuelle (acceptedAt > notifiedAt). C'est une
      // approximation V1 : si la diff est < 2s, on considere auto.
      const isAuto =
        a.acceptedAt &&
        Math.abs(a.acceptedAt.getTime() - a.notifiedAt.getTime()) < 2000;
      items.push({
        id: `assign-${a.id}`,
        at,
        icon: isAuto ? Sparkles : CheckCircle2,
        iconColor: isAuto ? "text-[#1e3a8a]" : "text-emerald-600",
        iconBg: isAuto ? "bg-blue-50" : "bg-emerald-50",
        label: isAuto
          ? `Auto-accept : ${categoryName} à ${city}`
          : `Lead acheté : ${categoryName} à ${city}`,
      });
    } else if (a.status === "REFUSED") {
      items.push({
        id: `assign-${a.id}`,
        at,
        icon: XCircle,
        iconColor: "text-slate-500",
        iconBg: "bg-slate-100",
        label: `Lead refusé : ${categoryName}`,
      });
    }
    // PENDING + EXPIRED : pas d'event "activite" — on les exclut pour
    // garder le fil concis.
  }

  for (const t of txs) {
    // Skip les LEAD_DEBIT qui sont deja lies a un ACCEPTED affiche
    // au-dessus pour eviter le doublon (1 ACCEPTED = 1 LEAD_DEBIT).
    if (t.type === "LEAD_DEBIT" && t.leadAssignmentId) continue;

    const euros = (t.amountCents / 100).toFixed(2).replace(".", ",");

    switch (t.type) {
      case "TOPUP":
      case "ADMIN_CREDIT":
        items.push({
          id: `tx-${t.id}`,
          at: t.createdAt,
          icon: Wallet,
          iconColor: "text-emerald-600",
          iconBg: "bg-emerald-50",
          label:
            t.type === "TOPUP"
              ? "Wallet rechargé"
              : "Crédit admin",
          trailing: `+${euros} €`,
        });
        break;
      case "ADMIN_DEBIT":
        items.push({
          id: `tx-${t.id}`,
          at: t.createdAt,
          icon: ArrowDownCircle,
          iconColor: "text-rose-600",
          iconBg: "bg-rose-50",
          label: "Débit admin",
          trailing: `-${euros} €`,
        });
        break;
      case "LEAD_DEBIT":
        // Cas rare : debit sans assignment lie (anomalie). On l'affiche
        // tout de meme pour ne pas masquer.
        items.push({
          id: `tx-${t.id}`,
          at: t.createdAt,
          icon: ArrowDownCircle,
          iconColor: "text-rose-600",
          iconBg: "bg-rose-50",
          label: "Wallet débité",
          trailing: `-${euros} €`,
        });
        break;
      case "REFUND_TO_CREDIT":
        items.push({
          id: `tx-${t.id}`,
          at: t.createdAt,
          icon: Wallet,
          iconColor: "text-emerald-600",
          iconBg: "bg-emerald-50",
          label: "Remboursement",
          trailing: `+${euros} €`,
        });
        break;
    }
  }

  return items
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit);
}
