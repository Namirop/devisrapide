import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Eye,
  MapPin,
  Wallet,
  Warning,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";

import { LeadActionsBar } from "@/components/dashboard/leads/LeadActionsBar";
import { requireProSession } from "@/lib/auth-guards";
import { urgencyLabel } from "@/lib/email/helpers";
import { prisma } from "@/lib/prisma";
import { formatPriceCents } from "@/lib/stats";

type Params = Promise<{ id: string }>;

export default async function LeadDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const { proProfileId } = await requireProSession();

  const assignment = await prisma.leadAssignment.findUnique({
    where: { id },
    select: {
      id: true,
      proProfileId: true,
      status: true,
      priceCents: true,
      expiresAt: true,
      notifiedAt: true,
      radiusKmAtAssignment: true,
      lead: {
        select: {
          urgency: true,
          description: true,
          postalCode: true,
          city: true,
          clientFirstName: true,
          clientLastName: true,
          expiresAt: true,
          deletedAt: true,
          exclusiveLeadPriceCentsSnapshot: true,
          // 0 ACCEPTED → le lead est encore prenable en exclusivite.
          assignments: {
            where: { status: "ACCEPTED" },
            select: { id: true },
            take: 1,
          },
          subCategory: {
            select: {
              name: true,
              category: { select: { name: true } },
            },
          },
        },
      },
      proProfile: {
        select: { walletBalanceCents: true },
      },
    },
  });

  if (
    !assignment ||
    assignment.proProfileId !== proProfileId ||
    assignment.lead.deletedAt
  ) {
    notFound();
  }
  if (assignment.status === "ACCEPTED") {
    redirect(`/dashboard/mes-demandes/${assignment.id}`);
  }
  // REFUSED : le pro a volontairement ecarte ce lead, il ne doit plus y
  // revenir. EXPIRED en revanche reste consultable en lecture seule tant que
  // le lead vit — c'est le pendant de la ligne grisee dans la liste.
  if (assignment.status !== "PENDING" && assignment.status !== "EXPIRED") {
    notFound();
  }

  const now = new Date();
  const unavailable =
    assignment.status === "EXPIRED" ||
    assignment.expiresAt < now ||
    (assignment.lead.expiresAt !== null && assignment.lead.expiresAt < now);
  const hasBuyer = assignment.lead.assignments.length > 0;

  const balanceCents = assignment.proProfile.walletBalanceCents;
  const balanceAfterCents = balanceCents - assignment.priceCents;
  const canAfford = balanceCents >= assignment.priceCents;
  const initial = assignment.lead.clientLastName.charAt(0).toUpperCase();

  // Achat exclusif : disponible tant que le lead n'a aucun acheteur (0/3).
  // Prix lu sur le snapshot exclusif du lead (~x2.5, deja calcule a la
  // creation). Aucun compteur n'est affiche, juste la dispo de l'option.
  const exclusiveAvailable = !hasBuyer;
  const exclusivePriceCents = assignment.lead.exclusiveLeadPriceCentsSnapshot;
  const canAffordExclusive = balanceCents >= exclusivePriceCents;

  return (
    <main className="mx-auto max-w-4xl px-5 pt-4 pb-6 sm:px-10 sm:pt-5 sm:pb-8">
      <Link
        href="/dashboard/leads"
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={14} weight="regular" />
        Retour aux leads disponibles
      </Link>

      <header className="mb-8">
        <h1 className="font-display text-[26px] font-bold tracking-tight text-slate-900 lg:text-[32px]">
          {assignment.lead.subCategory.category.name}
          <span className="text-slate-400"> · </span>
          <span className="text-slate-700">{assignment.lead.subCategory.name}</span>
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} weight="regular" />
            {assignment.lead.postalCode} {assignment.lead.city}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} weight="regular" />
            Reçu {formatRelative(assignment.notifiedAt)}
          </span>
          {assignment.lead.urgency === "URGENT" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[11.5px] font-semibold text-[#ea580c]">
              <Warning size={12} weight="bold" />
              Urgent
            </span>
          )}
        </div>
      </header>

      {unavailable && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          <WarningCircle size={16} weight="regular" className="mt-0.5 shrink-0" />
          <span>
            {hasBuyer
              ? "Ce lead a déjà été acheté par un autre professionnel. Il n'est plus disponible."
              : "Ce lead n'est plus disponible à l'achat."}
          </span>
        </div>
      )}

      {/* Sections plat avec dividers (pas de card englobante imbriquée) */}
      <SectionTitle title="Détails du projet" />
      <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Urgence" value={urgencyLabel(assignment.lead.urgency)} />
        <Field
          label="Localisation"
          value={`${assignment.lead.postalCode} ${assignment.lead.city}`}
        />
      </dl>
      <div className="mt-4">
        <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
          Description du projet
        </dt>
        <dd className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-slate-700">
          {assignment.lead.description}
        </dd>
      </div>

      <div className="my-8 border-t border-slate-200" />

      <SectionTitle title="Client" />
      <div className="mt-4 flex items-start gap-3 rounded-md bg-slate-50 p-4">
        <Eye size={16} weight="regular" className="mt-0.5 shrink-0 text-slate-400" />
        <div className="text-[13px] text-slate-600">
          <div className="font-semibold text-slate-900">
            {assignment.lead.clientFirstName} {initial}.
          </div>
          <p className="mt-1">
            Téléphone et email complets disponibles après l&apos;achat du lead.
          </p>
        </div>
      </div>

      <div className="my-8 border-t border-slate-200" />

      <SectionTitle title="Paiement" icon />
      <dl className="mt-4 flex flex-col gap-2 text-[13.5px]">
        <Row
          label="Solde wallet actuel"
          value={formatPriceCents(balanceCents)}
        />
        <Row
          label="Prix du lead"
          value={
            unavailable
              ? formatPriceCents(assignment.priceCents)
              : `- ${formatPriceCents(assignment.priceCents)}`
          }
        />
        {!unavailable && (
          <>
            <div className="my-2 border-t border-slate-200" />
            <Row
              label="Solde après acceptation"
              value={formatPriceCents(balanceAfterCents)}
              bold
              warning={!canAfford}
            />
          </>
        )}
      </dl>
      {!unavailable && !canAfford && (
        <div className="mt-4 flex items-start gap-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-900">
          <WarningCircle size={16} weight="regular" className="mt-0.5 shrink-0" />
          <div className="flex-1">
            Solde insuffisant.{" "}
            <Link href="/dashboard/wallet" className="font-semibold underline">
              Rechargez votre wallet
            </Link>{" "}
            pour acheter ce lead.
          </div>
        </div>
      )}

      {!unavailable && (
        <div className="mt-8">
          <LeadActionsBar
            assignmentId={assignment.id}
            priceLabel={formatPriceCents(assignment.priceCents)}
            canAfford={canAfford}
            exclusivePriceLabel={formatPriceCents(exclusivePriceCents)}
            exclusiveAvailable={exclusiveAvailable}
            canAffordExclusive={canAffordExclusive}
          />
        </div>
      )}
    </main>
  );
}

function SectionTitle({ title, icon }: { title: string; icon?: boolean }) {
  return (
    <header>
      <h2 className="font-display flex items-center gap-2 text-[18px] font-bold text-slate-900">
        {icon && <Wallet size={18} weight="regular" className="text-[#1e3a8a]" />}
        {title}
      </h2>
      <div
        className="mt-2 h-[2px] w-8"
        style={{ backgroundColor: "#ea580c" }}
        aria-hidden
      />
    </header>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-[14px] text-slate-900">{value}</dd>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  warning,
}: {
  label: string;
  value: string;
  bold?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-600">{label}</dt>
      <dd
        className={
          (bold ? "font-display text-[16px] font-bold " : "") +
          (warning ? "text-rose-600" : "text-slate-900")
        }
      >
        {value}
      </dd>
    </div>
  );
}

function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.floor(hours / 24)} j`;
}
