import {
  ArrowCircleDown,
  CheckCircle,
  Sparkle,
  Wallet,
  XCircle,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

import { prisma } from "@/lib/prisma";

export type ActivityItem = {
  id: string;
  at: Date;
  icon: Icon;
  iconColor: string;
  iconBg: string;
  label: string;
  /** Suffixe optionnel (montant…) affiché en fin de ligne. */
  trailing?: string;
};

/**
 * Fil d'activité du pro : leads achetés ou refusés et mouvements de wallet,
 * fusionnés et triés du plus récent au plus ancien (10 par défaut).
 */
export async function getRecentActivity(input: {
  proProfileId: string;
  userId: string;
  limit?: number;
}): Promise<ActivityItem[]> {
  const { proProfileId, userId, limit = 10 } = input;

  // 2 × limit par source : assez d'éléments après fusion, même si une source
  // domine ou si des lignes sont écartées.
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
    const at = a.acceptedAt ?? a.refusedAt ?? a.notifiedAt;
    const categoryName = a.lead.subCategory.category.name;
    const city = a.lead.city;

    if (a.status === "ACCEPTED") {
      // Limite connue : l'auto-accept n'est pas tracé en base ; il est déduit
      // d'un achat survenu moins de 2 s après la notification.
      const isAuto =
        a.acceptedAt &&
        Math.abs(a.acceptedAt.getTime() - a.notifiedAt.getTime()) < 2000;
      items.push({
        id: `assign-${a.id}`,
        at,
        icon: isAuto ? Sparkle : CheckCircle,
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
    // PENDING et EXPIRED ne sont pas des événements d'activité.
  }

  for (const t of txs) {
    // Débit lié à un achat : déjà représenté par la ligne de l'assignment.
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
          icon: ArrowCircleDown,
          iconColor: "text-rose-600",
          iconBg: "bg-rose-50",
          label: "Débit admin",
          trailing: `-${euros} €`,
        });
        break;
      case "LEAD_DEBIT":
        // Débit sans assignment lié (anomalie) : affiché plutôt que masqué.
        items.push({
          id: `tx-${t.id}`,
          at: t.createdAt,
          icon: ArrowCircleDown,
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
