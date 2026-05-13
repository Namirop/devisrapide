import type { LeadFollowupStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type MyLead = {
  assignmentId: string;
  leadId: string;
  priceCents: number;
  acceptedAt: Date;
  followupStatus: LeadFollowupStatus;
  urgency: "URGENT" | "SOON" | "PLANNED" | "FLEXIBLE";
  city: string;
  postalCode: string;
  categoryId: string;
  categoryName: string;
  subCategoryName: string;
  clientFirstName: string;
  clientLastName: string;
};

/**
 * Recupere les LeadAssignment ACCEPTED par le pro pour la page
 * /dashboard/mes-demandes. Le filtrage par followupStatus est cote UI
 * (tabs client) — V1 simple, suffisant tant que les volumes restent
 * raisonnables. Pour de gros volumes, ajouter un filtre query + index
 * compose (proProfileId, status, followupStatus).
 */
export async function getMyLeads(input: {
  proProfileId: string;
  limit?: number;
  skip?: number;
}): Promise<MyLead[]> {
  const { proProfileId, limit, skip } = input;

  const rows = await prisma.leadAssignment.findMany({
    where: { proProfileId, status: "ACCEPTED" },
    orderBy: { acceptedAt: "desc" },
    take: limit,
    skip,
    select: {
      id: true,
      leadId: true,
      priceCents: true,
      acceptedAt: true,
      followupStatus: true,
      lead: {
        select: {
          urgency: true,
          city: true,
          postalCode: true,
          clientFirstName: true,
          clientLastName: true,
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
    // acceptedAt est marque non-null pour les ACCEPTED par definition
    // (Sprint 2a). Fallback technique : Date(0) si jamais null.
    acceptedAt: r.acceptedAt ?? new Date(0),
    followupStatus: r.followupStatus,
    urgency: r.lead.urgency,
    city: r.lead.city,
    postalCode: r.lead.postalCode,
    categoryId: r.lead.subCategory.category.id,
    categoryName: r.lead.subCategory.category.name,
    subCategoryName: r.lead.subCategory.name,
    clientFirstName: r.lead.clientFirstName,
    clientLastName: r.lead.clientLastName,
  }));
}

export async function countMyLeads(proProfileId: string): Promise<number> {
  return prisma.leadAssignment.count({
    where: { proProfileId, status: "ACCEPTED" },
  });
}
