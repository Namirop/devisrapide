import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AdminLeadsTab =
  "tous" | "en-souffrance" | "actifs" | "acceptes" | "exclusifs" | "expires";

export type AdminLeadRow = {
  id: string;
  status:
    | "PENDING_MATCH"
    | "ASSIGNED"
    | "ACCEPTED"
    | "COMPLETED"
    | "EXPIRED"
    | "CANCELLED";
  categoryName: string;
  subCategoryName: string;
  city: string;
  postalCode: string;
  priceCents: number;
  isExclusive: boolean;
  createdAt: Date;
  matchingStartedAt: Date | null;
  acceptedAssignmentsCount: number;
  isSouffrance: boolean;
};

/**
 * Filtre Prisma par onglet, soft-deletes toujours exclus. « En souffrance » :
 * lead PENDING_MATCH/ASSIGNED créé avant `souffranceCutoff` (réglage
 * LEAD_SOUFFRANCE_HOURS) et encore sans acheteur.
 */
function buildLeadsWhere(
  tab: AdminLeadsTab,
  souffranceCutoff: Date,
): Prisma.LeadWhereInput {
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
        createdAt: { lt: souffranceCutoff },
        assignments: { none: { status: "ACCEPTED" } },
      };
  }
}

export async function listAdminLeads(input: {
  tab: AdminLeadsTab;
  limit: number;
  skip: number;
  souffranceCutoff: Date;
}): Promise<{ rows: AdminLeadRow[]; total: number }> {
  const { souffranceCutoff } = input;
  const where = buildLeadsWhere(input.tab, souffranceCutoff);

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

  const rows: AdminLeadRow[] = leadsRaw.map((l) => {
    const acceptedAssignmentsCount = l.assignments.length;
    const isSouffrance =
      (l.status === "PENDING_MATCH" || l.status === "ASSIGNED") &&
      l.createdAt < souffranceCutoff &&
      acceptedAssignmentsCount === 0;
    return {
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
      acceptedAssignmentsCount,
      isSouffrance,
    };
  });

  return { rows, total };
}

/**
 * Compteurs des onglets : 6 `count` en parallèle, acceptable pour le faible
 * volume d'un panel admin.
 */
export async function getLeadsTabsCounts(
  souffranceCutoff: Date,
): Promise<Record<AdminLeadsTab, number>> {
  const [tous, actifs, acceptes, exclusifs, expires, enSouffrance] =
    await Promise.all([
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
          createdAt: { lt: souffranceCutoff },
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
