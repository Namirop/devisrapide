import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AvailableLead = {
  assignmentId: string;
  leadId: string;
  priceCents: number;
  createdAt: Date;
  urgency: "URGENT" | "SOON" | "PLANNED" | "FLEXIBLE";
  city: string;
  postalCode: string;
  categoryId: string;
  categoryName: string;
  subCategoryName: string;
  // Vrai tant que le lead n'a aucun acheteur. Le nombre d'acheteurs n'est
  // jamais exposé aux pros, seulement ce booléen.
  isExclusiveAvailable: boolean;
  // TAKEN : plus achetable (vendu, offert, délai écoulé) mais affiché en
  // grisé jusqu'à la fin de vie du lead, pour rendre l'activité visible.
  state: "AVAILABLE" | "TAKEN";
  // Libellé « Vendu » plutôt que le générique « Plus disponible ».
  hasBuyer: boolean;
};

/**
 * Un assignment reste visible tant que le lead est vivant, pas seulement tant
 * qu'il est PENDING : les EXPIRED apparaissent en grisé. Les REFUSED
 * disparaissent aussitôt (geste volontaire du pro) ; les ACCEPTED sont dans
 * « Mes demandes ».
 */
function visibleWhere(
  proProfileId: string,
  now: Date,
): Prisma.LeadAssignmentWhereInput {
  return {
    proProfileId,
    status: { in: ["PENDING", "EXPIRED"] },
    lead: {
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  };
}

/** Sous-ensemble encore achetable des lignes visibles. */
function purchasableWhere(
  proProfileId: string,
  now: Date,
): Prisma.LeadAssignmentWhereInput {
  return {
    ...visibleWhere(proProfileId, now),
    status: "PENDING",
    expiresAt: { gt: now },
  };
}

/**
 * Leads du dashboard pro, du plus récent au plus ancien, lignes achetables et
 * grisées mêlées : l'ordre chronologique donne à voir l'activité.
 */
export async function getAvailableLeads(input: {
  proProfileId: string;
  limit?: number;
  skip?: number;
}): Promise<AvailableLead[]> {
  const { proProfileId, limit, skip } = input;
  const now = new Date();

  const rows = await prisma.leadAssignment.findMany({
    where: visibleWhere(proProfileId, now),
    orderBy: { notifiedAt: "desc" },
    take: limit,
    skip,
    select: {
      id: true,
      leadId: true,
      priceCents: true,
      notifiedAt: true,
      status: true,
      expiresAt: true,
      lead: {
        select: {
          urgency: true,
          city: true,
          postalCode: true,
          // Un seul ACCEPTED suffit à fermer l'exclusivité : inutile d'en
          // charger davantage.
          assignments: {
            where: { status: "ACCEPTED" },
            select: { id: true },
            take: 1,
          },
          subCategory: {
            select: {
              name: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  return rows.map((r) => {
    const hasBuyer = r.lead.assignments.length > 0;
    const state: AvailableLead["state"] =
      r.status === "PENDING" && r.expiresAt > now ? "AVAILABLE" : "TAKEN";
    return {
      assignmentId: r.id,
      leadId: r.leadId,
      priceCents: r.priceCents,
      createdAt: r.notifiedAt,
      urgency: r.lead.urgency,
      city: r.lead.city,
      postalCode: r.lead.postalCode,
      categoryId: r.lead.subCategory.category.id,
      categoryName: r.lead.subCategory.category.name,
      subCategoryName: r.lead.subCategory.name,
      isExclusiveAvailable: state === "AVAILABLE" && !hasBuyer,
      state,
      hasBuyer,
    };
  });
}

/**
 * Leads encore achetables (badge de la sidebar, compteur de section). Les
 * lignes grisées sont exclues : un badge annonce des opportunités.
 */
export async function countAvailableLeads(
  proProfileId: string,
): Promise<number> {
  return prisma.leadAssignment.count({
    where: purchasableWhere(proProfileId, new Date()),
  });
}

/** Toutes les lignes affichées, grisées comprises (pagination). */
export async function countVisibleLeads(proProfileId: string): Promise<number> {
  return prisma.leadAssignment.count({
    where: visibleWhere(proProfileId, new Date()),
  });
}
