import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Clock,
  Eye,
  MapPin,
  Wallet,
} from "lucide-react";

import { LeadActionsBar } from "@/components/dashboard/LeadActionsBar";
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

  if (!assignment || assignment.proProfileId !== proProfileId) {
    notFound();
  }
  if (assignment.status !== "PENDING") {
    // Redirige vers la version "mes-demandes" si deja acceptee.
    if (assignment.status === "ACCEPTED") {
      const { redirect } = await import("next/navigation");
      redirect(`/dashboard/mes-demandes/${assignment.id}`);
    }
    notFound();
  }

  const now = new Date();
  const expired =
    assignment.expiresAt < now ||
    (assignment.lead.expiresAt !== null && assignment.lead.expiresAt < now);

  const balanceCents = assignment.proProfile.walletBalanceCents;
  const balanceAfterCents = balanceCents - assignment.priceCents;
  const canAfford = balanceCents >= assignment.priceCents;

  const initial = assignment.lead.clientLastName.charAt(0).toUpperCase();

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <Link
        href="/dashboard/leads"
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Retour aux leads disponibles
      </Link>

      <header className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900 lg:text-[26px]">
          {assignment.lead.subCategory.category.name} ·{" "}
          {assignment.lead.subCategory.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            {assignment.lead.postalCode} {assignment.lead.city}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Reçu {formatRelative(assignment.notifiedAt)}
          </span>
          {assignment.lead.urgency === "URGENT" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[11.5px] font-semibold text-[#ea580c]">
              <AlertTriangle className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              Urgent
            </span>
          )}
        </div>
      </header>

      {expired && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          <span>
            Ce lead a expiré. Vous ne pouvez plus l&apos;acheter.
          </span>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-[15px] font-bold text-slate-900">
          Détails du projet
        </h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-slate-500">
              Urgence
            </dt>
            <dd className="mt-1 text-[14px] text-slate-900">
              {urgencyLabel(assignment.lead.urgency)}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-slate-500">
              Localisation
            </dt>
            <dd className="mt-1 text-[14px] text-slate-900">
              {assignment.lead.postalCode} {assignment.lead.city}
            </dd>
          </div>
        </dl>
        <div className="mt-4">
          <dt className="text-[12px] font-medium uppercase tracking-wide text-slate-500">
            Description du projet
          </dt>
          <dd className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-slate-700">
            {assignment.lead.description}
          </dd>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-[15px] font-bold text-slate-900">Client</h2>
        <div className="mt-3 flex items-start gap-3 rounded-md bg-slate-50 p-3">
          <Eye
            className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
            strokeWidth={2}
            aria-hidden
          />
          <div className="text-[13px] text-slate-600">
            <div className="font-semibold text-slate-900">
              {assignment.lead.clientFirstName} {initial}.
            </div>
            <p className="mt-1">
              Téléphone et email complets disponibles après l&apos;achat du
              lead.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Wallet
            className="h-4 w-4 text-[#1e3a8a]"
            strokeWidth={2}
            aria-hidden
          />
          <h2 className="text-[15px] font-bold text-slate-900">Paiement</h2>
        </div>
        <dl className="mt-4 flex flex-col gap-2 text-[13.5px]">
          <Row label="Solde wallet actuel" value={formatPriceCents(balanceCents)} />
          <Row
            label="Prix du lead"
            value={`- ${formatPriceCents(assignment.priceCents)}`}
            negative
          />
          <div className="my-2 border-t border-slate-200" />
          <Row
            label="Solde après acceptation"
            value={formatPriceCents(balanceAfterCents)}
            bold
            warning={!canAfford}
          />
        </dl>
        {!canAfford && (
          <div className="mt-4 flex items-start gap-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-900">
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              strokeWidth={2}
              aria-hidden
            />
            <div className="flex-1">
              Solde insuffisant.{" "}
              <Link
                href="/dashboard/wallet"
                className="font-semibold underline"
              >
                Rechargez votre wallet
              </Link>{" "}
              pour acheter ce lead.
            </div>
          </div>
        )}
      </section>

      <div className="mt-6">
        <LeadActionsBar
          assignmentId={assignment.id}
          priceLabel={formatPriceCents(assignment.priceCents)}
          canAfford={canAfford && !expired}
        />
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  negative,
  bold,
  warning,
}: {
  label: string;
  value: string;
  negative?: boolean;
  bold?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-600">{label}</dt>
      <dd
        className={
          (bold ? "font-bold text-[15px] " : "") +
          (warning ? "text-rose-600" : negative ? "text-slate-700" : "text-slate-900")
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
