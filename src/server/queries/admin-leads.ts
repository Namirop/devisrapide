import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AdminLeadsTab =
  | "tous"
  | "en-souffrance"
  | "actifs"
  | "acceptes"
  | "exclusifs"
  | "expires";

export type AdminLeadRow = {
  id: string;
  status: "PENDING_MATCH" | "ASSIGNED" | "ACCEPTED" | "COMPLETED" | "EXPIRED" | "CANCELLED";
  categoryName: string;
  subCategoryName: string;
  city: string;
  postalCode: string;
  priceCents: number;
  isExclusive: boolean;
  createdAt: Date;
  matchingStartedAt: Date | null;
  acceptedAssignmentsCount: number;
};

/**
 * Resout le where Prisma selon l'onglet. "en souffrance" = leads
 * PENDING_MATCH/ASSIGNED depuis >2h sans aucun ACCEPTED. Toujours
 * applique deletedAt: null pour ne pas remonter les soft-deletes.
 */
function buildLeadsWhere(tab: AdminLeadsTab): Prisma.LeadWhereInput {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  switch (tab) {
    case "tous":
      return { deletedAt: null };
    case "actifs":
      return {
        deletedAt: null,
        status: { in: ["PENDING_MATCH", "ASSIGNED"] },
      };
    case "acceptes":
      return {
        deletedAt: null,
        status: { in: ["ACCEPTED", "COMPLETED"] },
      };
    case "exclusifs":
      return { deletedAt: null, isExclusive: true };
    case "expires":
      return {
        deletedAt: null,
        status: { in: ["EXPIRED", "CANCELLED"] },
      };
    case "en-souffrance":
      return {
        deletedAt: null,
        status: { in: ["PENDING_MATCH", "ASSIGNED"] },
        matchingStartedAt: { lt: twoHoursAgo },
        assignments: { none: { status: "ACCEPTED" } },
      };
  }
}

export async function listAdminLeads(input: {
  tab: AdminLeadsTab;
  limit: number;
  skip: number;
}): Promise<{ rows: AdminLeadRow[]; total: number }> {
  const where = buildLeadsWhere(input.tab);

  const [leadsRaw, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: input.limit,
      skip: input.skip,
      select: {
        id: true,
        status: true,
        city: true,
        postalCode: true,
        isExclusive: true,
        createdAt: true,
        matchingStartedAt: true,
        sharedLeadPriceCentsSnapshot: true,
        exclusiveLeadPriceCentsSnapshot: true,
        subCategory: {
          select: {
            name: true,
            category: { select: { name: true } },
          },
        },
        assignments: {
          where: { status: "ACCEPTED" },
          select: { id: true },
        },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  const rows: AdminLeadRow[] = leadsRaw.map((l) => ({
    id: l.id,
    status: l.status,
    categoryName: l.subCategory.category.name,
    subCategoryName: l.subCategory.name,
    city: l.city,
    postalCode: l.postalCode,
    priceCents: l.isExclusive
      ? l.exclusiveLeadPriceCentsSnapshot
      : l.sharedLeadPriceCentsSnapshot,
    isExclusive: l.isExclusive,
    createdAt: l.createdAt,
    matchingStartedAt: l.matchingStartedAt,
    acceptedAssignmentsCount: l.assignments.length,
  }));

  return { rows, total };
}

/**
 * Counts pour les badges de tabs (affiches a cote du nom de l'onglet).
 * Recalcule chaque count separement — 6 queries en parallele. Tolerable
 * pour un panel admin (volumetrie faible).
 */
export async function getLeadsTabsCounts(): Promise<
  Record<AdminLeadsTab, number>
> {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const [
    tous,
    actifs,
    acceptes,
    exclusifs,
    expires,
    enSouffrance,
  ] = await Promise.all([
    prisma.lead.count({ where: { deletedAt: null } }),
    prisma.lead.count({
      where: {
        deletedAt: null,
        status: { in: ["PENDING_MATCH", "ASSIGNED"] },
      },
    }),
    prisma.lead.count({
      where: {
        deletedAt: null,
        status: { in: ["ACCEPTED", "COMPLETED"] },
      },
    }),
    prisma.lead.count({ where: { deletedAt: null, isExclusive: true } }),
    prisma.lead.count({
      where: { deletedAt: null, status: { in: ["EXPIRED", "CANCELLED"] } },
    }),
    prisma.lead.count({
      where: {
        deletedAt: null,
        status: { in: ["PENDING_MATCH", "ASSIGNED"] },
        matchingStartedAt: { lt: twoHoursAgo },
        assignments: { none: { status: "ACCEPTED" } },
      },
    }),
  ]);

  return {
    tous,
    actifs,
    acceptes,
    exclusifs,
    expires,
    "en-souffrance": enSouffrance,
  };
}
