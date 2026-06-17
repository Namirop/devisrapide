import Link from "next/link";
import {
  ArrowRight,
  ChartBar,
  CurrencyEur,
  GearSix,
  Invoice,
  Receipt,
  SquaresFour,
  Tray,
  Users,
} from "@phosphor-icons/react/dist/ssr";

import { Logo } from "@/components/ds/Logo";
import { prisma } from "@/lib/prisma";
import { nowMinusHours } from "@/lib/time";

import { AdminNavLink } from "./AdminNavLink";

type Props = {
  proProfileId: string | null;
  email: string;
};

/**
 * Contenu de la Sidebar admin. Dark theme charcoal :
 *  - Background bg-[#1a1f2e] (charcoal anthracite, distinct du navy
 *    nuit du dashboard pro #0f1e3d).
 *  - Item actif highlight bg-[#2a3045] (lighter shade) + barre verticale
 *    3px rouge #dc2626 a gauche (cf. AdminNavLink).
 *
 * Bottom : "Connecte en tant qu'admin" + email + lien "Retour dashboard
 * pro" si l'admin a un ProProfile, + bouton logout via form Server Action.
 *
 * Badges :
 *  - "Professionnels" : count PENDING validation
 *  - "Leads" : count "en souffrance" (ACTIVE matchingStartedAt < now - 2h
 *    sans ACCEPTED) — signal urgence admin
 */
export async function AdminSidebarContent({ proProfileId, email }: Props) {
  const twoHoursAgo = nowMinusHours(2);

  const [pendingProsCount, soufranceLeadsCount] = await Promise.all([
    prisma.proProfile.count({
      where: { validationStatus: "PENDING" },
    }),
    // Lead "en souffrance" : matching commence depuis >2h, aucun assignment
    // ACCEPTED. On compte les Leads dont aucun LeadAssignment n'est
    // ACCEPTED. Approximation : Lead.status PENDING_MATCH ou ASSIGNED +
    // matchingStartedAt < 2h ago.
    prisma.lead.count({
      where: {
        status: { in: ["PENDING_MATCH", "ASSIGNED"] },
        matchingStartedAt: { lt: twoHoursAgo },
        deletedAt: null,
        assignments: { none: { status: "ACCEPTED" } },
      },
    }),
  ]);

  const iconSize = 20;

  return (
    <div className="flex h-full flex-col bg-[#1a1f2e]">
      {/* Logo + sous-titre */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        {/* Picto PNG bleu inverse en silhouette blanche pour lisibilite sur
            le charcoal sombre — meme technique que le Footer LP et la sidebar
            pro (brightness-0 + invert sur l'<img> enfant). */}
        <div className="inline-block [&_img]:brightness-0 [&_img]:invert">
          <Logo size={44} showText={false} href="/admin" theme="dark" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-display text-[18px] font-bold tracking-tight text-white">
            DevisRapide
          </span>
          <span className="mt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#dc2626]">
            Panel Admin
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="flex flex-col gap-1">
          <li>
            <AdminNavLink
              href="/admin"
              icon={<SquaresFour size={iconSize} weight="regular" />}
              iconActive={<SquaresFour size={iconSize} weight="bold" />}
              label="Tableau de bord"
            />
          </li>
          <li>
            <AdminNavLink
              href="/admin/leads"
              icon={<Tray size={iconSize} weight="regular" />}
              iconActive={<Tray size={iconSize} weight="bold" />}
              label="Leads"
              badge={soufranceLeadsCount}
            />
          </li>
          <li>
            <AdminNavLink
              href="/admin/professionnels"
              icon={<Users size={iconSize} weight="regular" />}
              iconActive={<Users size={iconSize} weight="bold" />}
              label="Professionnels"
              badge={pendingProsCount}
            />
          </li>
          <li>
            <AdminNavLink
              href="/admin/prix"
              icon={<CurrencyEur size={iconSize} weight="regular" />}
              iconActive={<CurrencyEur size={iconSize} weight="bold" />}
              label="Prix"
            />
          </li>
          <li>
            <AdminNavLink
              href="/admin/transactions"
              icon={<Receipt size={iconSize} weight="regular" />}
              iconActive={<Receipt size={iconSize} weight="bold" />}
              label="Transactions"
            />
          </li>
          <li>
            <AdminNavLink
              href="/admin/finances"
              icon={<Invoice size={iconSize} weight="regular" />}
              iconActive={<Invoice size={iconSize} weight="bold" />}
              label="Finances"
            />
          </li>
          <li>
            <AdminNavLink
              href="/admin/statistiques"
              icon={<ChartBar size={iconSize} weight="regular" />}
              iconActive={<ChartBar size={iconSize} weight="bold" />}
              label="Statistiques"
            />
          </li>
          <li>
            <AdminNavLink
              href="/admin/configuration"
              icon={<GearSix size={iconSize} weight="regular" />}
              iconActive={<GearSix size={iconSize} weight="bold" />}
              label="Configuration"
            />
          </li>
        </ul>
      </nav>

      {/* Bottom : context admin + retour pro (si applicable) */}
      <div className="bg-[#15192a] px-3 py-4">
        <div className="rounded-md px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
            Connecté en tant qu&apos;admin
          </div>
          <div
            className="mt-1 truncate text-[12px] text-slate-300"
            title={email}
          >
            {email}
          </div>
        </div>

        {proProfileId && (
          <Link
            href="/dashboard"
            className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowRight size={14} weight="regular" aria-hidden />
            Retour au dashboard pro
          </Link>
        )}
      </div>
    </div>
  );
}
