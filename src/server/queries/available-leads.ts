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
};

/**
 * Recupere les LeadAssignment PENDING (= "leads disponibles") pour un pro
 * donne, avec les champs minimaux pour l'affichage en card.
 *
 * Trie par notifiedAt desc (plus recents en premier). Limite optionnelle :
 *   - 5 pour la card dashboard home
 *   - undefined ou >5 pour la page /dashboard/leads avec pagination
 */
export async function getAvailableLeads(input: {
  proProfileId: string;
  limit?: number;
  skip?: number;
}): Promise<AvailableLead[]> {
  const { proProfileId, limit, skip } = input;

  const rows = await prisma.leadAssignment.findMany({
    where: { proProfileId, status: "PENDING" },
    orderBy: { notifiedAt: "desc" },
    take: limit,
    skip,
    select: {
      id: true,
      leadId: true,
      priceCents: true,
      notifiedAt: true,
      lead: {
        select: {
          urgency: true,
          city: true,
          postalCode: true,
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

  return rows.map((r) => ({
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
  }));
}

/** Compte total des PENDING pour ce pro (pagination + badge sidebar). */
export async function countAvailableLeads(proProfileId: string): Promise<number> {
  return prisma.leadAssignment.count({
    where: { proProfileId, status: "PENDING" },
  });
}
