import type { Prisma, ProValidationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AdminProsTab =
  | "tous"
  | "en-attente"
  | "valides"
  | "suspendus"
  | "refuses";

export type AdminProRow = {
  proProfileId: string;
  companyName: string;
  vatNumber: string | null;
  email: string;
  city: string;
  postalCode: string;
  interventionRadiusKm: number;
  walletBalanceCents: number;
  validationStatus: ProValidationStatus;
  createdAt: Date;
};

function buildProsWhere(tab: AdminProsTab): Prisma.ProProfileWhereInput {
  switch (tab) {
    case "tous":
      return {};
    case "en-attente":
      return { validationStatus: "PENDING" };
    case "valides":
      return { validationStatus: "VALIDATED" };
    case "suspendus":
      return { validationStatus: "SUSPENDED" };
    case "refuses":
      return { validationStatus: "REJECTED" };
  }
}

export async function listAdminPros(input: {
  tab: AdminProsTab;
  limit: number;
  skip: number;
}): Promise<{ rows: AdminProRow[]; total: number }> {
  const where = buildProsWhere(input.tab);

  const [prosRaw, total] = await Promise.all([
    prisma.proProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: input.limit,
      skip: input.skip,
      select: {
        id: true,
        companyName: true,
        vatNumber: true,
        city: true,
        postalCode: true,
        interventionRadiusKm: true,
        walletBalanceCents: true,
        validationStatus: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    }),
    prisma.proProfile.count({ where }),
  ]);

  const rows: AdminProRow[] = prosRaw.map((p) => ({
    proProfileId: p.id,
    companyName: p.companyName,
    vatNumber: p.vatNumber,
    email: p.user.email,
    city: p.city,
    postalCode: p.postalCode,
    interventionRadiusKm: p.interventionRadiusKm,
    walletBalanceCents: p.walletBalanceCents,
    validationStatus: p.validationStatus,
    createdAt: p.createdAt,
  }));

  return { rows, total };
}

export async function getProsTabsCounts(): Promise<
  Record<AdminProsTab, number>
> {
  const [tous, pending, validated, suspended, rejected] = await Promise.all([
    prisma.proProfile.count(),
    prisma.proProfile.count({ where: { validationStatus: "PENDING" } }),
    prisma.proProfile.count({ where: { validationStatus: "VALIDATED" } }),
    prisma.proProfile.count({ where: { validationStatus: "SUSPENDED" } }),
    prisma.proProfile.count({ where: { validationStatus: "REJECTED" } }),
  ]);

  return {
    tous,
    "en-attente": pending,
    valides: validated,
    suspendus: suspended,
    refuses: rejected,
  };
}
