import {
  PendingProsList,
  type PendingProRow,
} from "@/components/admin/pros/PendingProsList";
import { prisma } from "@/lib/prisma";

/**
 * Chargement async de la carte « Pros en attente » de l'accueil admin,
 * streamée sous `<Suspense>`.
 */
export async function AdminPendingProsSection() {
  const [pendingProsRaw, totalCount] = await Promise.all([
    prisma.proProfile.findMany({
      where: { validationStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: {
        id: true,
        companyName: true,
        vatNumber: true,
        createdAt: true,
      },
    }),
    prisma.proProfile.count({ where: { validationStatus: "PENDING" } }),
  ]);

  const pendingPros: PendingProRow[] = pendingProsRaw.map((p) => ({
    proProfileId: p.id,
    companyName: p.companyName,
    vatNumber: p.vatNumber,
    createdAt: p.createdAt,
  }));

  return <PendingProsList pros={pendingPros} totalCount={totalCount} />;
}
