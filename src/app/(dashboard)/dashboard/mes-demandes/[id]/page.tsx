import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  EnvelopeSimple,
  MapPin,
  Phone,
  User as UserIcon,
} from "@phosphor-icons/react/dist/ssr";

import { QualificationButtons } from "@/components/dashboard/QualificationButtons";
import { buttonVariants } from "@/components/ui/button";
import { requireProSession } from "@/lib/auth-guards";
import { cn } from "@/lib/utils";
import { urgencyLabel } from "@/lib/email/helpers";
import { prisma } from "@/lib/prisma";
import { formatPriceCents } from "@/lib/stats";

type Params = Promise<{ id: string }>;

export default async function MyLeadDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const { proProfileId } = await requireProSession();

  const assignment = await prisma.leadAssignment.findUnique({
    where: { id },
    select: {
      id: true,
      proProfileId: true,
      status: true,
      followupStatus: true,
      priceCents: true,
      acceptedAt: true,
      radiusKmAtAssignment: true,
      lead: {
        select: {
          urgency: true,
          description: true,
          postalCode: true,
          city: true,
          address: true,
          clientFirstName: true,
          clientLastName: true,
          clientEmail: true,
          clientPhone: true,
          subCategory: {
            select: {
              name: true,
              category: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (
    !assignment ||
    assignment.proProfileId !== proProfileId ||
    assignment.status !== "ACCEPTED"
  ) {
    notFound();
  }

  const fullName = `${assignment.lead.clientFirstName} ${assignment.lead.clientLastName}`;
  const radiusLabel =
    assignment.radiusKmAtAssignment === -1
      ? "Toute la Belgique"
      : `${assignment.radiusKmAtAssignment} km`;

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-8">
      <Link
        href="/dashboard/mes-demandes"
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={14} weight="regular" />
        Retour à mes demandes
      </Link>

      <header className="mb-8">
        <h1 className="font-display text-[26px] font-bold tracking-tight text-slate-900 lg:text-[32px]">
          {assignment.lead.subCategory.category.name}
          <span className="text-slate-400"> · </span>
          <span className="text-slate-700">
            {assignment.lead.subCategory.name}
          </span>
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} weight="regular" />
            {assignment.lead.postalCode} {assignment.lead.city}
          </span>
          {assignment.acceptedAt && (
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} weight="regular" />
              Accepté {formatRelative(assignment.acceptedAt)}
            </span>
          )}
        </div>
      </header>

      {/* Section 1 — Coordonnées client */}
      <SectionTitle title="Coordonnées du client" icon={UserIcon} />
      <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        <Field label="Nom complet" value={fullName} />
        <Field
          label="Téléphone"
          value={
            <a
              href={`tel:${assignment.lead.clientPhone}`}
              className="text-[#1e3a8a] hover:underline"
            >
              {assignment.lead.clientPhone}
            </a>
          }
        />
        <Field
          label="Email"
          value={
            <a
              href={`mailto:${assignment.lead.clientEmail}`}
              className="text-[#1e3a8a] hover:underline"
            >
              {assignment.lead.clientEmail}
            </a>
          }
        />
        <Field
          label="Adresse"
          value={
            assignment.lead.address
              ? `${assignment.lead.address}, ${assignment.lead.postalCode} ${assignment.lead.city}`
              : `${assignment.lead.postalCode} ${assignment.lead.city}`
          }
        />
      </dl>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <a
          href={`tel:${assignment.lead.clientPhone}`}
          className={cn(buttonVariants({ variant: "accent" }), "h-10 gap-2")}
        >
          <Phone size={16} weight="regular" />
          Appeler le client
        </a>
        <a
          href={`mailto:${assignment.lead.clientEmail}`}
          className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-2")}
        >
          <EnvelopeSimple size={16} weight="regular" />
          Envoyer un email
        </a>
      </div>

      <div className="my-8 border-t border-slate-200" />

      {/* Section 2 — Projet */}
      <SectionTitle title="Projet" />
      <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Urgence" value={urgencyLabel(assignment.lead.urgency)} />
        <Field
          label="Localisation"
          value={`${assignment.lead.postalCode} ${assignment.lead.city}`}
        />
      </dl>
      <div className="mt-4">
        <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
          Description
        </dt>
        <dd className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-slate-700">
          {assignment.lead.description}
        </dd>
      </div>

      <div className="my-8 border-t border-slate-200" />

      {/* Section 3 — Qualification */}
      <SectionTitle title="Qualifier ce lead" />
      <p className="mt-2 text-[13px] text-slate-500">
        Aidez la plateforme à améliorer le matching en indiquant le devenir
        du lead après votre contact avec le client.
      </p>
      <div className="mt-4">
        <QualificationButtons
          assignmentId={assignment.id}
          current={assignment.followupStatus}
        />
      </div>

      <div className="my-8 border-t border-slate-200" />

      {/* Section 4 — Détails techniques (footer discret) */}
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
        Détails techniques
      </h3>
      <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-[13px] sm:grid-cols-3">
        <Field
          label="Montant payé"
          value={formatPriceCents(assignment.priceCents)}
          compact
        />
        <Field
          label="Date d'acceptation"
          value={
            assignment.acceptedAt?.toLocaleString("fr-BE", {
              dateStyle: "medium",
              timeStyle: "short",
            }) ?? "—"
          }
          compact
        />
        <Field label="Palier d'attribution" value={radiusLabel} compact />
      </dl>
    </main>
  );
}

function SectionTitle({
  title,
  icon: IconComp,
}: {
  title: string;
  icon?: React.ComponentType<{
    size?: number;
    weight?: "regular" | "bold";
    className?: string;
  }>;
}) {
  return (
    <header>
      <h2 className="font-display flex items-center gap-2 text-[18px] font-bold text-slate-900">
        {IconComp && (
          <IconComp size={18} weight="regular" className="text-[#1e3a8a]" />
        )}
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
  compact,
}: {
  label: string;
  value: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
        {label}
      </dt>
      <dd
        className={
          compact
            ? "mt-0.5 text-[13px] text-slate-700"
            : "mt-1 text-[14px] text-slate-900"
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
