import {
  CheckCircle2,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  User,
  Wallet,
} from "lucide-react";

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
 * Sidebar fixe gauche du dashboard pro. Server Component qui fetch en
 * parallele les compteurs des items (PENDING leads disponibles +
 * ACCEPTED ce mois). Mobile : cache via Tailwind, le drawer mobile
 * arrivera dans le commit TopBar si necessaire (V1 : juste desktop).
 */
export async function Sidebar({ proProfileId }: Props) {
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

  return (
    <aside className="hidden h-screen w-[260px] shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      {/* Logo + sous-titre */}
      <div className="border-b border-slate-200 px-5 py-5">
        <Logo size={36} href="/dashboard" />
        <p className="mt-1 pl-[46px] text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
          Espace Artisan
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          <li>
            <NavLink
              href="/dashboard"
              icon={<LayoutDashboard className="h-[18px] w-[18px]" strokeWidth={2} />}
              label="Tableau de bord"
            />
          </li>
          <li>
            <NavLink
              href="/dashboard/leads"
              icon={<Inbox className="h-[18px] w-[18px]" strokeWidth={2} />}
              label="Leads disponibles"
              badge={pendingCount}
            />
          </li>
          <li>
            <NavLink
              href="/dashboard/mes-demandes"
              icon={<CheckCircle2 className="h-[18px] w-[18px]" strokeWidth={2} />}
              label="Mes demandes"
              badge={acceptedThisMonthCount}
            />
          </li>
          <li>
            <NavLink
              href="/dashboard/wallet"
              icon={<Wallet className="h-[18px] w-[18px]" strokeWidth={2} />}
              label="Wallet & Crédits"
            />
          </li>
          <li>
            <NavLink
              href="/dashboard/profil"
              icon={<User className="h-[18px] w-[18px]" strokeWidth={2} />}
              label="Profil & Entreprise"
            />
          </li>
        </ul>
      </nav>

      {/* Bottom : aide + logout */}
      <div className="border-t border-slate-200 px-3 py-4">
        <div className="rounded-md bg-slate-50 px-3 py-3">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
            <LifeBuoy
              className="h-[14px] w-[14px] text-[#1e3a8a]"
              strokeWidth={2}
              aria-hidden
            />
            Besoin d&apos;aide&nbsp;?
          </div>
          <a
            href={`mailto:${CONTACT.EMAIL}`}
            className="mt-1 block text-[12px] text-slate-500 hover:text-[#1e3a8a]"
          >
            {CONTACT.EMAIL}
          </a>
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="mt-2"
        >
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[14px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut
              className="h-[18px] w-[18px] shrink-0"
              strokeWidth={2}
              aria-hidden
            />
            Se déconnecter
          </button>
        </form>
      </div>
    </aside>
  );
}
