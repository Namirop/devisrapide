import {
  CheckCircle,
  Lifebuoy,
  SignOut,
  SquaresFour,
  Tray,
  User,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";

import { Logo } from "@/components/ds/Logo";
import { CONTACT } from "@/lib/contact";
import { startOfMonth } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { signOut } from "@/lib/auth";

import { NavLink } from "./NavLink";

type Props = {
  proProfileId: string;
};

/**
 * Contenu de la Sidebar dashboard pro. Dark theme :
 *  - Background --color-b2b-dark (#0f1e3d)
 *  - Bottom zone (aide + logout) --color-navy-darker (#0a1530) pour
 *    delimiter visuellement
 *  - Item actif highlighted via NavLink (barre verticale orange a gauche)
 *
 * Server Component utilise par :
 *  - <Sidebar> wrapper desktop (hidden lg:flex).
 *  - <MobileSidebar> drawer mobile via Sheet.
 *
 * Icones Phosphor (weight regular inactif, bold actif) au lieu de lucide,
 * cf. refonte 2b redesign.
 */
export async function SidebarContent({ proProfileId }: Props) {
  const monthStart = startOfMonth(new Date());

  const [pendingCount, acceptedThisMonthCount] = await Promise.all([
    prisma.leadAssignment.count({
      where: { proProfileId, status: "PENDING" },
    }),
    prisma.leadAssignment.count({
      where: {
        proProfileId,
        status: "ACCEPTED",
        acceptedAt: { gte: monthStart },
      },
    }),
  ]);

  const iconSize = 20;

  return (
    <div className="flex h-full flex-col bg-[var(--color-b2b-dark)]">
      {/* Logo + sous-titre */}
      <div className="px-5 py-5">
        <Logo size={36} href="/dashboard" theme="dark" />
        <p className="mt-1 pl-[46px] text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
          Espace Artisan
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="flex flex-col gap-1">
          <li>
            <NavLink
              href="/dashboard"
              icon={<SquaresFour size={iconSize} weight="regular" />}
              iconActive={<SquaresFour size={iconSize} weight="bold" />}
              label="Tableau de bord"
            />
          </li>
          <li>
            <NavLink
              href="/dashboard/leads"
              icon={<Tray size={iconSize} weight="regular" />}
              iconActive={<Tray size={iconSize} weight="bold" />}
              label="Leads disponibles"
              badge={pendingCount}
            />
          </li>
          <li>
            <NavLink
              href="/dashboard/mes-demandes"
              icon={<CheckCircle size={iconSize} weight="regular" />}
              iconActive={<CheckCircle size={iconSize} weight="bold" />}
              label="Mes demandes"
              badge={acceptedThisMonthCount}
            />
          </li>
          <li>
            <NavLink
              href="/dashboard/wallet"
              icon={<Wallet size={iconSize} weight="regular" />}
              iconActive={<Wallet size={iconSize} weight="bold" />}
              label="Wallet & Crédits"
            />
          </li>
          <li>
            <NavLink
              href="/dashboard/profil"
              icon={<User size={iconSize} weight="regular" />}
              iconActive={<User size={iconSize} weight="bold" />}
              label="Profil & Entreprise"
            />
          </li>
        </ul>
      </nav>

      {/* Bottom : aide + logout (zone plus sombre que le reste sidebar) */}
      <div className="bg-[var(--color-navy-darker)] px-3 py-4">
        <div className="rounded-md px-3 py-3">
          <div className="flex items-center gap-2 text-[13px] font-medium text-slate-200">
            <Lifebuoy
              size={16}
              weight="regular"
              className="text-[var(--accent)]"
              aria-hidden
            />
            Besoin d&apos;aide&nbsp;?
          </div>
          <a
            href={`mailto:${CONTACT.EMAIL}`}
            className="mt-1 block text-[12px] text-slate-400 hover:text-slate-200"
          >
            {CONTACT.EMAIL}
          </a>
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="mt-1"
        >
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[14px] font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <SignOut
              size={18}
              weight="regular"
              className="shrink-0"
              aria-hidden
            />
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}
