import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Gift } from "@phosphor-icons/react/dist/ssr";

import { DeleteLeadButton } from "@/components/admin/leads/DeleteLeadButton";
import { OfferLeadModal } from "@/components/admin/leads/OfferLeadModal";
import { requireAdminSession } from "@/lib/auth-guards";
import { formatDateTimeBE } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { formatPriceCents } from "@/lib/stats";
import { cn } from "@/lib/utils";

type Params = Promise<{ id: string }>;

const URGENCY_LABEL: Record<string, string> = {
  URGENT: "Urgent (24-48h)",
  SOON: "Bientôt (semaine)",
  PLANNED: "Planifié (mois)",
  FLEXIBLE: "Flexible",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_MATCH: "En attente de matching",
  ASSIGNED: "Pros notifiés",
  ACCEPTED: "Accepté",
  COMPLETED: "Terminé",
  EXPIRED: "Expiré",
  CANCELLED: "Annulé",
};

const ASSIGNMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  EXPIRED: "Expiré",
};

export default async function AdminLeadDetailPage({
  params,
}: {
  params: Params;
}) {
  await requireAdminSession();
  const { id } = await params;

  // findUnique + findMany independants -> Promise.all pour ne payer
  // qu'un aller-retour DB au lieu de deux sequentiels.
  const [lead, validatedPros] = await Promise.all([
    prisma.lead.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        subCategory: {
          select: {
            name: true,
            category: { select: { name: true } },
          },
        },
        assignments: {
          orderBy: { notifiedAt: "desc" },
          select: {
            id: true,
            status: true,
            priceCents: true,
            isExclusive: true,
            notifiedAt: true,
            acceptedAt: true,
            refusedAt: true,
            refusalReason: true,
            adminGifted: true,
            adminGiftNote: true,
            proProfile: {
              select: {
                id: true,
                companyName: true,
                vatNumber: true,
                user: { select: { email: true } },
              },
            },
          },
        },
      },
    }),
    // Pros VALIDATED pour le dropdown du modal "Offrir ce lead". V1 :
    // pas de filtre geo (admin override), tous les VALIDATED listes.
    prisma.proProfile.findMany({
      where: { validationStatus: "VALIDATED" },
      orderBy: { companyName: "asc" },
      select: {
        id: true,
        companyName: true,
        city: true,
        postalCode: true,
      },
    }),
  ]);

  if (!lead || lead.deletedAt) {
    notFound();
  }

  // Statut d'assignment par pro : le modal en a besoin pour distinguer le pro
  // qui possede deja le lead (non offrable) de celui qui l'a juste recu sans
  // l'acheter (offrable — l'action recycle l'assignment existant).
  const assignmentStatusByProId = lead.assignments.map((a) => ({
    proProfileId: a.proProfile.id,
    status: a.status,
  }));

  const canOfferLead =
    lead.status !== "EXPIRED" && lead.status !== "CANCELLED";

  // Suppression possible tant qu'aucun pro n'a acheté (assignment ACCEPTED).
  // Le Server Action revérifie côté serveur (défense en profondeur).
  const hasAcceptedAssignment = lead.assignments.some(
    (a) => a.status === "ACCEPTED",
  );

  return (
    <main className="px-5 pt-4 pb-6 sm:px-10 sm:pt-5 sm:pb-8">
      <Link
        href="/admin/leads"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={14} weight="regular" />
        Retour aux leads
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-bold tracking-tight text-slate-900 lg:text-[32px]">
            {lead.subCategory.category.name} — {lead.subCategory.name}
          </h1>
          <p className="mt-1 text-[14px] text-slate-500">
            <span className="font-mono text-[12px] text-slate-400">
              #{lead.id.slice(-8)}
            </span>{" "}
            · Statut :{" "}
            <span className="font-medium text-slate-700">
              {STATUS_LABEL[lead.status] ?? lead.status}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canOfferLead && (
            <OfferLeadModal
              leadId={lead.id}
              pros={validatedPros}
              assignmentStatusByProId={assignmentStatusByProId}
            />
          )}
          {!hasAcceptedAssignment && <DeleteLeadButton leadId={lead.id} />}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Block title="Informations lead">
          <Row label="Catégorie" value={lead.subCategory.category.name} />
          <Row label="Sous-catégorie" value={lead.subCategory.name} />
          <Row
            label="Localisation"
            value={`${lead.postalCode} ${lead.city}${
              lead.address ? ` — ${lead.address}` : ""
            }`}
          />
          <Row
            label="Urgence"
            value={URGENCY_LABEL[lead.urgency] ?? lead.urgency}
          />
          <Row
            label="Exclusif"
            value={lead.isExclusive ? "Oui" : "Non (partagé)"}
          />
          <Row
            label="Prix snapshot"
            value={formatPriceCents(
              lead.isExclusive
                ? lead.exclusiveLeadPriceCentsSnapshot
                : lead.sharedLeadPriceCentsSnapshot,
            )}
          />
          <Row label="Créé" value={formatDate(lead.createdAt)} />
          {lead.matchingStartedAt && (
            <Row
              label="Matching démarré"
              value={formatDate(lead.matchingStartedAt)}
            />
          )}
          {lead.expiresAt && (
            <Row label="Expire" value={formatDate(lead.expiresAt)} />
          )}
          <Row
            label="Description"
            value={lead.description}
            multiline
          />
        </Block>

        <Block title="Particulier (client)">
          <Row
            label="Nom"
            value={`${lead.client.firstName ?? ""} ${
              lead.client.lastName ?? ""
            }`.trim() || lead.clientFirstName + " " + lead.clientLastName}
          />
          <Row label="Email" value={lead.clientEmail} mono />
          <Row label="Téléphone" value={lead.clientPhone} mono />
          <Row
            label="Adresse complète"
            value={
              lead.address
                ? `${lead.address}, ${lead.postalCode} ${lead.city}`
                : `${lead.postalCode} ${lead.city}`
            }
          />
        </Block>
      </div>

      <section className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-display text-[18px] font-bold tracking-tight text-slate-900">
            Assignments ({lead.assignments.length})
          </h2>
          <p className="mt-1 text-[12.5px] text-slate-500">
            Historique des envois et acceptations sur ce lead.
          </p>
        </header>

        {lead.assignments.length === 0 ? (
          <div className="px-6 py-10 text-center text-[13px] text-slate-500">
            Aucun pro n&apos;a encore été notifié pour ce lead.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {lead.assignments.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-3 px-5 py-3 sm:gap-5 sm:py-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold text-slate-900">
                      {a.proProfile.companyName}
                    </span>
                    <span className="text-[11.5px] text-slate-400">·</span>
                    <span className="font-mono text-[11.5px] text-slate-500">
                      {a.proProfile.user.email}
                    </span>
                    {a.adminGifted && (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-orange-50 px-1.5 py-px text-[10.5px] font-semibold text-[#ea580c]">
                        <Gift size={10} weight="bold" />
                        Offert par admin
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-slate-500">
                    <span>Envoyé {formatDate(a.notifiedAt)}</span>
                    {a.acceptedAt && (
                      <span>· Accepté {formatDate(a.acceptedAt)}</span>
                    )}
                    {a.refusedAt && (
                      <span>· Refusé {formatDate(a.refusedAt)}</span>
                    )}
                    {a.refusalReason && (
                      <span className="italic">
                        · Motif refus : &laquo;{a.refusalReason}&raquo;
                      </span>
                    )}
                    {a.adminGifted && a.adminGiftNote && (
                      <span className="italic">
                        · Note admin : &laquo;{a.adminGiftNote}&raquo;
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    "whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider",
                    assignmentStatusClasses(a.status),
                  )}
                >
                  {ASSIGNMENT_STATUS_LABEL[a.status] ?? a.status}
                </span>
                <span className="font-display whitespace-nowrap text-[14px] font-bold text-slate-900">
                  {formatPriceCents(a.priceCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
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
      <dl className="flex flex-col gap-2.5">{children}</dl>
    </section>
  );
}

function Row({
  label,
  value,
  mono,
  multiline,
}: {
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-1",
        multiline
          ? "grid-cols-1"
          : "grid-cols-[120px_1fr] items-baseline sm:grid-cols-[140px_1fr]",
      )}
    >
      <dt className="text-[12px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd
        className={cn(
          "text-[13.5px] text-slate-900",
          mono && "font-mono text-[12px]",
          multiline && "mt-1 whitespace-pre-wrap leading-relaxed text-slate-700",
        )}
      >
        {value || <span className="italic text-slate-400">—</span>}
      </dd>
    </div>
  );
}

function assignmentStatusClasses(status: string): string {
  switch (status) {
    case "ACCEPTED":
      return "bg-emerald-50 text-emerald-700";
    case "REFUSED":
      return "bg-slate-100 text-slate-600";
    case "EXPIRED":
      return "bg-slate-100 text-slate-500";
    case "PENDING":
    default:
      return "bg-blue-50 text-[#1e3a8a]";
  }
}

function formatDate(d: Date): string {
  return formatDateTimeBE(d);
}
