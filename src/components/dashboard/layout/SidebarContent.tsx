import {
  CheckCircle,
  Lifebuoy,
  SquaresFour,
  Tray,
  User,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";

import { Logo } from "@/components/ds/Logo";
import { CONTACT } from "@/lib/contact";
import { startOfMonth } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { countAvailableLeads } from "@/server/queries/available-leads";

import { NavLink } from "./NavLink";

type Props = {
  proProfileId: string;
};

/**
 * Contenu de la sidebar du dashboard pro, partagé entre `Sidebar` (desktop)
 * et `MobileSidebar`. La déconnexion vit uniquement dans le `UserMenu`.
 */
export async function SidebarContent({ proProfileId }: Props) {
  const monthStart = startOfMonth(new Date());

  // Le badge ne compte que les leads encore achetables : les lignes grisées
  // (lead vendu ou offert) n'appellent aucune action.
  const [pendingCount, acceptedThisMonthCount] = await Promise.all([
    countAvailableLeads(proProfileId),
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
      {/* Logo sans texte : le nom est composé ici, plus grand que celui du
          composant Logo, avec son sur-titre juste dessous. */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        {/* Picto PNG bleu passé en silhouette blanche (brightness-0 +
            invert) pour rester lisible sur le navy. */}
        <div className="inline-block [&_img]:brightness-0 [&_img]:invert">
          <Logo size={48} showText={false} href="/dashboard" theme="dark" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-display text-[22px] font-bold tracking-tight text-white">
            DevisRapide
          </span>
          <span className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Espace Artisan
          </span>
        </div>
      </div>

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
      </div>
    </div>
  );
}
