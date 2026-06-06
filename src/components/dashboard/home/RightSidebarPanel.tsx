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

import { AutoAcceptToggleRow } from "@/components/dashboard/profile/AutoAcceptToggleRow";

type Props = {
  autoAccept: boolean;
  currentRadiusKm: number;
  categories: Array<{ id: string; name: string }>;
  /**
   * Affiche la section "Actions rapides" (liens wallet/historique/support).
   * Defaut true (dashboard reel inchange). La page mockup la masque pour
   * raccourcir le panneau et tenir dans l'ecran 16:9 du laptop.
   */
  showQuickActions?: boolean;
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
 * Card bg-white + border-slate-200 (avant bg-slate-50 invisible sur le
 * fond de page slate-50). 4 sections separees par border-t.
 *
 * Sections :
 *  1. Auto-accept : toggle + statut + courte explication
 *  2. Portee de reception : 3 rows radio-style (point orange = actif)
 *  3. Metiers couverts : pills de cat actives + lien profil
 *  4. Actions rapides : 3 liens minimalistes (icon + label + chevron)
 */
export function RightSidebarPanel({
  autoAccept,
  currentRadiusKm,
  categories,
  showQuickActions = true,
}: Props) {
  return (
    <aside className="space-y-0 rounded-lg border border-slate-200 bg-white p-5">
      {/* Section 1 : Auto-accept */}
      <PanelSection icon={Sparkle} title="Auto-accept" isFirst>
        <AutoAcceptToggleRow initialValue={autoAccept} />
      </PanelSection>

      {/* Section 2 : Portee */}
      <PanelSection icon={MapPin} title="Portée de réception">
        <ul className="flex flex-col gap-0.5">
          {RADIUS_PALIERS.map((p) => {
            const active = p.value === currentRadiusKm;
            return (
              <li
                key={p.value}
                className={cn(
                  "flex items-center gap-2.5 py-1.5 text-[13px] transition-colors",
                  active ? "font-semibold text-slate-900" : "text-slate-600",
                )}
              >
                <span
                  className={cn(
                    "grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 transition-colors",
                    active ? "border-[#ea580c]" : "border-slate-300",
                  )}
                  aria-hidden
                >
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ea580c]" />
                  )}
                </span>
                {p.label}
              </li>
            );
          })}
        </ul>
        <Link
          href="/dashboard/profil"
          className="mt-2.5 inline-block text-[12px] font-medium text-[#1e3a8a] hover:underline"
        >
          Modifier ma zone →
        </Link>
      </PanelSection>

      {/* Section 3 : Metiers */}
      <PanelSection
        icon={Briefcase}
        title="Métiers couverts"
        isLast={!showQuickActions}
      >
        {categories.length === 0 ? (
          <p className="text-[12.5px] text-slate-500">
            Aucune catégorie active.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <li
                key={c.id}
                className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-[12px] font-medium text-[#1e3a8a]"
              >
                {c.name}
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/dashboard/profil"
          className="mt-2.5 inline-block text-[12px] font-medium text-[#1e3a8a] hover:underline"
        >
          Gérer mes catégories →
        </Link>
      </PanelSection>

      {/* Section 4 : Actions rapides (sans border-b car derniere) */}
      {showQuickActions && (
        <PanelSection title="Actions rapides" isLast>
          <ul className="flex flex-col gap-0.5">
            {QUICK_ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <li key={a.label}>
                  <Link
                    href={a.href}
                    target={a.external ? "_blank" : undefined}
                    className="group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-slate-50"
                  >
                    <Icon
                      size={16}
                      weight="regular"
                      className="shrink-0 text-[#1e3a8a]"
                      aria-hidden
                    />
                    <span className="flex-1 text-[13px] font-medium text-slate-700 group-hover:text-slate-900">
                      {a.label}
                    </span>
                    <CaretRight
                      size={12}
                      weight="bold"
                      className="text-slate-400 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </PanelSection>
      )}
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
        "py-5",
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
