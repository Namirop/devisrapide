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
  // True tant que le lead n'a aucun acheteur (0/3) : le pro peut encore le
  // prendre en exclusivite. Pas de compteur expose cote pro, juste ce booleen.
  isExclusiveAvailable: boolean;
  // AVAILABLE = achetable maintenant. TAKEN = le lead est parti (vendu,
  // exclusif, offert) mais reste affiche en grise jusqu'a la fin de sa duree
  // de vie : le pro voit que ca bouge, ce qui pousse a acheter plus vite.
  state: "AVAILABLE" | "TAKEN";
  // Au moins un pro a achete ce lead → libelle "Vendu" plutot que le
  // generique "Plus disponible".
  hasBuyer: boolean;
};

/**
 * Un assignment reste affiche dans le dashboard du pro tant que le LEAD est
 * vivant — pas seulement tant que l'assignment est PENDING. Les EXPIRED sont
 * donc inclus (rendus en grise), les REFUSED non : un refus est un geste
 * volontaire du pro, la ligne doit disparaitre de SA liste immediatement.
 * Les ACCEPTED vivent dans "Mes demandes".
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
 * Recupere les leads a afficher dans le dashboard d'un pro, avec les champs
 * minimaux pour l'affichage en card.
 *
 * Trie par notifiedAt desc (plus recents en premier), lignes achetables et
 * grisees melangees : l'ordre chronologique est justement ce qui donne a voir
 * l'activite de la plateforme.
 *
 * Limite optionnelle :
 *   - 5 pour la card dashboard home
 *   - undefined ou >5 pour la page /dashboard/leads avec pagination
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
          // 1 ACCEPTED suffit a fermer l'exclusivite ; take: 1 evite de
          // compter au-dela. On n'expose jamais le nombre, juste le booleen.
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
 * Compte les leads encore achetables (badge sidebar, compteur de section).
 * Exclut les lignes grisees : un badge doit annoncer des opportunites, pas
 * des trains deja partis.
 */
export async function countAvailableLeads(proProfileId: string): Promise<number> {
  return prisma.leadAssignment.count({
    where: purchasableWhere(proProfileId, new Date()),
  });
}

/** Compte toutes les lignes affichees, grisees comprises (pagination). */
export async function countVisibleLeads(proProfileId: string): Promise<number> {
  return prisma.leadAssignment.count({
    where: visibleWhere(proProfileId, new Date()),
  });
}
