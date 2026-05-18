import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import type { ProValidationStatus } from "@prisma/client";

import { AdjustWalletModal } from "@/components/admin/wallet/AdjustWalletModal";
import { EditProProfileModal } from "@/components/admin/pros/EditProProfileModal";
import { ProActionPanel } from "@/components/admin/pros/ProActionPanel";
import { requireAdminSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatPriceCents } from "@/lib/stats";
import { cn } from "@/lib/utils";

type Params = Promise<{ id: string }>;

const STATUS_META: Record<
  ProValidationStatus,
  { label: string; bg: string; text: string }
> = {
  PENDING: { label: "En attente", bg: "bg-orange-50", text: "text-[#ea580c]" },
  VALIDATED: { label: "Validé", bg: "bg-emerald-50", text: "text-emerald-700" },
  SUSPENDED: { label: "Suspendu", bg: "bg-rose-50", text: "text-rose-700" },
  REJECTED: { label: "Refusé", bg: "bg-slate-100", text: "text-slate-600" },
};

const ASSIGNMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  EXPIRED: "Expiré",
};

const TX_TYPE_LABEL: Record<string, string> = {
  TOPUP: "Recharge",
  LEAD_DEBIT: "Achat lead",
  ADMIN_CREDIT: "Crédit admin",
  ADMIN_DEBIT: "Débit admin",
  REFUND_TO_CREDIT: "Remboursement",
};

const TX_TYPE_SIGN: Record<string, "credit" | "debit"> = {
  TOPUP: "credit",
  LEAD_DEBIT: "debit",
  ADMIN_CREDIT: "credit",
  ADMIN_DEBIT: "debit",
  REFUND_TO_CREDIT: "credit",
};

export default async function AdminProDetailPage({
  params,
}: {
  params: Params;
}) {
  await requireAdminSession();
  const { id } = await params;

  const pro = await prisma.proProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
        },
      },
      categories: {
        select: {
          category: { select: { id: true, name: true } },
        },
      },
      assignments: {
        orderBy: { notifiedAt: "desc" },
        take: 10,
        select: {
          id: true,
          status: true,
          priceCents: true,
          notifiedAt: true,
          acceptedAt: true,
          adminGifted: true,
          lead: {
            select: {
              id: true,
              subCategory: {
                select: {
                  name: true,
                  category: { select: { name: true } },
                },
              },
              city: true,
              postalCode: true,
            },
          },
        },
      },
    },
  });

  if (!pro) {
    notFound();
  }

  const walletTxs = await prisma.walletTransaction.findMany({
    where: { userId: pro.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      type: true,
      amountCents: true,
      balanceAfterCents: true,
      description: true,
      createdAt: true,
    },
  });

  const meta = STATUS_META[pro.validationStatus];

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-8">
      <Link
        href="/admin/professionnels"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={14} weight="regular" />
        Retour aux professionnels
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[26px] font-bold tracking-tight text-slate-900 lg:text-[32px]">
              {pro.companyName}
            </h1>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                meta.bg,
                meta.text,
              )}
            >
              {meta.label}
            </span>
          </div>
          <p className="mt-1 text-[13.5px] text-slate-500">
            <span className="font-mono">{pro.vatNumber ?? "TVA non renseignée"}</span>
            {" · "}
            <span>{pro.user.email}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProActionPanel
            proProfileId={pro.id}
            status={pro.validationStatus}
          />
          <EditProProfileModal
            proProfileId={pro.id}
            initial={{
              companyName: pro.companyName,
              vatNumber: pro.vatNumber ?? "",
              email: pro.user.email,
              phone: pro.user.phone ?? "",
              firstName: pro.user.firstName ?? "",
              lastName: pro.user.lastName ?? "",
              interventionRadiusKm: pro.interventionRadiusKm,
              autoAccept: pro.autoAccept,
            }}
          />
        </div>
      </header>

      {/* Bannieres reasons selon statut (REJECTED ou SUSPENDED). */}
      {pro.validationStatus === "REJECTED" && pro.rejectedReason && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Raison du refus
          </div>
          <p className="mt-1 text-[14px] text-slate-700">{pro.rejectedReason}</p>
        </div>
      )}
      {pro.validationStatus === "SUSPENDED" && pro.suspensionReason && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50/50 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
            Raison de la suspension
          </div>
          <p className="mt-1 text-[14px] text-slate-700">
            {pro.suspensionReason}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Bloc Identité */}
        <Block title="Identité">
          <Row
            label="Nom commercial"
            value={pro.companyName}
          />
          <Row label="Numéro TVA" value={pro.vatNumber ?? ""} mono />
          <Row
            label="Contact"
            value={
              `${pro.user.firstName ?? ""} ${pro.user.lastName ?? ""}`.trim() ||
              "—"
            }
          />
          <Row label="Email" value={pro.user.email} mono />
          <Row label="Téléphone" value={pro.user.phone ?? "—"} mono />
          <Row
            label="Localisation"
            value={`${pro.postalCode} ${pro.city}`}
          />
          <Row
            label="Rayon d'intervention"
            value={
              pro.interventionRadiusKm === -1
                ? "Toute la Belgique francophone"
                : `${pro.interventionRadiusKm} km`
            }
          />
          <Row label="Auto-accept" value={pro.autoAccept ? "Activé" : "Désactivé"} />
          <Row label="Inscrit" value={formatDate(pro.createdAt)} />
          {pro.validatedAt && (
            <Row label="Validé" value={formatDate(pro.validatedAt)} />
          )}
        </Block>

        {/* Bloc Métiers */}
        <Block title="Métiers couverts">
          {pro.categories.length === 0 ? (
            <p className="text-[13px] text-slate-500">
              Aucun métier sélectionné.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {pro.categories.map((pc) => (
                <li
                  key={pc.category.id}
                  className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-[12.5px] font-medium text-[#1e3a8a]"
                >
                  {pc.category.name}
                </li>
              ))}
            </ul>
          )}
        </Block>

        {/* Bloc Wallet */}
        <Block title="Wallet">
          <div className="font-display text-[36px] font-bold leading-none tracking-tight text-slate-900">
            {formatPriceCents(pro.walletBalanceCents)}
          </div>
          <p className="mt-2 text-[12.5px] text-slate-500">Solde disponible.</p>
          <div className="mt-4">
            <AdjustWalletModal
              proProfileId={pro.id}
              currentBalanceCents={pro.walletBalanceCents}
            />
          </div>
        </Block>
      </div>

      {/* Section Activité récente */}
      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 10 derniers assignments */}
        <Block title="Derniers leads (10)">
          {pro.assignments.length === 0 ? (
            <p className="text-[13px] text-slate-500">
              Aucun lead notifié à ce pro.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {pro.assignments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2"
                >
                  <Link
                    href={`/admin/leads/${a.lead.id}`}
                    className="min-w-0 flex-1 hover:underline"
                  >
                    <div className="truncate text-[13px] font-semibold text-slate-900">
                      {a.lead.subCategory.category.name} — {a.lead.subCategory.name}
                    </div>
                    <div className="text-[11.5px] text-slate-500">
                      {a.lead.postalCode} {a.lead.city} · Envoyé{" "}
                      {formatDate(a.notifiedAt)}
                      {a.adminGifted && " · Offert par admin"}
                    </div>
                  </Link>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {ASSIGNMENT_STATUS_LABEL[a.status] ?? a.status}
                  </span>
                  <span className="font-display whitespace-nowrap text-[13px] font-bold text-slate-700">
                    {formatPriceCents(a.priceCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Block>

        {/* 10 dernières transactions wallet */}
        <Block title="Dernières transactions wallet (10)">
          {walletTxs.length === 0 ? (
            <p className="text-[13px] text-slate-500">
              Aucune transaction.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {walletTxs.map((tx) => {
                const sign = TX_TYPE_SIGN[tx.type];
                const isCredit = sign === "credit";
                return (
                  <li
                    key={tx.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-slate-900">
                        {TX_TYPE_LABEL[tx.type] ?? tx.type}
                      </div>
                      <div className="text-[11.5px] text-slate-500">
                        {formatDate(tx.createdAt)}
                        {tx.description ? ` · ${tx.description}` : ""}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "font-display whitespace-nowrap text-[13px] font-bold",
                        isCredit ? "text-emerald-600" : "text-rose-600",
                      )}
                    >
                      {isCredit ? "+" : "-"}
                      {formatPriceCents(tx.amountCents)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Block>
      </section>
    </main>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-display mb-4 text-[16px] font-bold tracking-tight text-slate-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-baseline gap-1 py-1 sm:grid-cols-[130px_1fr]">
      <dt className="text-[11.5px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd
        className={cn(
          "text-[13.5px] text-slate-900",
          mono && "font-mono text-[12.5px]",
        )}
      >
        {value || <span className="italic text-slate-400">—</span>}
      </dd>
    </div>
  );
}

function formatDate(d: Date): string {
  return d.toLocaleString("fr-BE", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
