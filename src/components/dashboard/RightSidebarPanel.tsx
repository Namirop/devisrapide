import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import {
  Briefcase,
  CaretRight,
  ClockCounterClockwise,
  Lifebuoy,
  MapPin,
  Sparkle,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";

import { CONTACT } from "@/lib/contact";
import { cn } from "@/lib/utils";

import { AutoAcceptToggleRow } from "./AutoAcceptToggleRow";

type Props = {
  autoAccept: boolean;
  currentRadiusKm: number;
  categories: Array<{ id: string; name: string }>;
};

const RADIUS_PALIERS = [
  { value: 30, label: "30 km" },
  { value: 60, label: "60 km" },
  { value: -1, label: "Partout en Belgique" },
] as const;

const QUICK_ACTIONS: Array<{
  icon: Icon;
  label: string;
  href: string;
  external?: boolean;
}> = [
  {
    icon: Wallet,
    label: "Recharger mon wallet",
    href: "/dashboard/wallet",
  },
  {
    icon: ClockCounterClockwise,
    label: "Voir mon historique",
    href: "/dashboard/wallet",
  },
  {
    icon: Lifebuoy,
    label: "Contacter le support",
    href: `mailto:${CONTACT.EMAIL}`,
    external: true,
  },
];

/**
 * Panneau lateral droit du dashboard home — refonte 2b redesign.
 *
 * Au lieu de 4 widgets en cards empilees, un seul panneau bg-slate-50
 * rounded-lg avec 4 sections separees par border-b slate-200. Donne un
 * aspect plus "tableau de bord plat" et hierarchique.
 *
 * Sections :
 *  1. Auto-accept : toggle + statut + courte explication
 *  2. Portee de reception : 3 pills (30/60/Belgique), pill active highlight
 *  3. Metiers couverts : pills de cat actives + lien profil
 *  4. Actions rapides : 3 liens minimalistes (icon + label + chevron)
 */
export function RightSidebarPanel({
  autoAccept,
  currentRadiusKm,
  categories,
}: Props) {
  return (
    <aside className="space-y-0 rounded-lg bg-slate-50 p-6">
      {/* Section 1 : Auto-accept */}
      <PanelSection
        icon={Sparkle}
        title="Auto-accept"
        isFirst
      >
        <AutoAcceptToggleRow initialValue={autoAccept} />
      </PanelSection>

      {/* Section 2 : Portee */}
      <PanelSection icon={MapPin} title="Portée de réception">
        <div className="flex flex-col gap-1.5">
          {RADIUS_PALIERS.map((p) => {
            const active = p.value === currentRadiusKm;
            return (
              <div
                key={p.value}
                className={cn(
                  "rounded-md border px-3 py-2 text-[12.5px] transition-colors",
                  active
                    ? "border-[#1e3a8a] bg-white font-medium text-[#1e3a8a]"
                    : "border-transparent bg-transparent text-slate-600",
                )}
              >
                {p.label}
              </div>
            );
          })}
        </div>
        <Link
          href="/dashboard/profil"
          className="mt-2 inline-block text-[12px] font-medium text-[#1e3a8a] hover:underline"
        >
          Modifier ma zone →
        </Link>
      </PanelSection>

      {/* Section 3 : Metiers */}
      <PanelSection icon={Briefcase} title="Métiers couverts">
        {categories.length === 0 ? (
          <p className="text-[12.5px] text-slate-500">
            Aucune catégorie active.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <li
                key={c.id}
                className="inline-flex items-center rounded-md border border-[#1e3a8a]/30 bg-white px-2 py-0.5 text-[12px] font-medium text-[#1e3a8a]"
              >
                {c.name}
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/dashboard/profil"
          className="mt-2 inline-block text-[12px] font-medium text-[#1e3a8a] hover:underline"
        >
          Gérer mes catégories →
        </Link>
      </PanelSection>

      {/* Section 4 : Actions rapides (sans border-b car derniere) */}
      <PanelSection title="Actions rapides" isLast>
        <ul className="flex flex-col gap-0.5">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <li key={a.label}>
                <Link
                  href={a.href}
                  target={a.external ? "_blank" : undefined}
                  className="group flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-white"
                >
                  <Icon
                    size={16}
                    weight="regular"
                    className="shrink-0 text-[#1e3a8a]"
                    aria-hidden
                  />
                  <span className="flex-1 text-[12.5px] font-medium text-slate-700 group-hover:text-slate-900">
                    {a.label}
                  </span>
                  <CaretRight
                    size={12}
                    weight="bold"
                    className="text-slate-400"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </PanelSection>
    </aside>
  );
}

function PanelSection({
  icon: IconComp,
  title,
  isFirst,
  isLast,
  children,
}: {
  icon?: Icon;
  title: string;
  isFirst?: boolean;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "py-4",
        !isFirst && "border-t border-slate-200",
        isFirst && "pt-0",
        isLast && "pb-0",
      )}
    >
      <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
        {IconComp && <IconComp size={12} weight="bold" />}
        {title}
      </h3>
      {children}
    </section>
  );
}
