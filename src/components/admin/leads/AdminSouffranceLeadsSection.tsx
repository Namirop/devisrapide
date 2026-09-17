import {
  SouffranceLeadsList,
  type SouffranceLeadRow,
} from "@/components/admin/leads/SouffranceLeadsList";
import { prisma } from "@/lib/prisma";
import { nowMinusHours } from "@/lib/time";

/**
 * Chargement async de la carte « Leads en souffrance » de l'accueil admin,
 * streamée sous `<Suspense>`.
 */
export async function AdminSouffranceLeadsSection() {
  const twoHoursAgo = nowMinusHours(2);

  const [souffranceLeadsRaw, totalCount] = await Promise.all([
    prisma.lead.findMany({
      where: {
        status: { in: ["PENDING_MATCH", "ASSIGNED"] },
        matchingStartedAt: { lt: twoHoursAgo },
        deletedAt: null,
        assignments: { none: { status: "ACCEPTED" } },
      },
      orderBy: { matchingStartedAt: "asc" },
      take: 5,
      select: {
        id: true,
        city: true,
        postalCode: true,
        matchingStartedAt: true,
        sharedLeadPriceCentsSnapshot: true,
        subCategory: {
          select: {
            name: true,
            category: { select: { name: true } },
          },
        },
      },
    }),
    prisma.lead.count({
      where: {
        status: { in: ["PENDING_MATCH", "ASSIGNED"] },
        matchingStartedAt: { lt: twoHoursAgo },
        deletedAt: null,
        assignments: { none: { status: "ACCEPTED" } },
      },
    }),
  ]);

  const souffranceLeads: SouffranceLeadRow[] = souffranceLeadsRaw.map((l) => ({
    id: l.id,
    categoryName: l.subCategory.category.name,
    subCategoryName: l.subCategory.name,
    city: l.city,
    postalCode: l.postalCode,
    priceCents: l.sharedLeadPriceCentsSnapshot,
    matchingStartedAt: l.matchingStartedAt,
  }));

  return (
    <SouffranceLeadsList leads={souffranceLeads} totalCount={totalCount} />
  );
}
