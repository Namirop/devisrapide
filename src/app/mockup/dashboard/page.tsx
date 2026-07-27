import { notFound } from "next/navigation";
import {
  CheckCircle,
  Lifebuoy,
  SquaresFour,
  Tray,
  User,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";

import { AvailableLeadsSection } from "@/components/dashboard/leads/AvailableLeadsSection";
import { RightSidebarPanel } from "@/components/dashboard/home/RightSidebarPanel";
import { StatsStrip } from "@/components/dashboard/home/StatsStrip";
import { Logo } from "@/components/ds/Logo";
import { CONTACT } from "@/lib/contact";
import type { AvailableLead } from "@/server/queries/available-leads";

// ─────────────────────────────────────────────────────────────────────────
// PAGE MOCKUP — capture du dashboard pour le laptop de la LP pro.
//
// Page jetable, DEV ONLY (notFound en prod), hors auth/BDD. Elle rejoue le
// dashboard home dans un canvas figé 16:9 (= zone ecran du laptop), en
// REUTILISANT les vrais composants presentationnels (StatsStrip,
// AvailableLeadsSection, RightSidebarPanel, RecentActivity, TipsSection)
// nourris de donnees mock realistes. Le chrome (sidebar + topbar) est une
// REPLIQUE statique : les vrais composants fetchent en BDD et la sidebar
// utilise usePathname pour l'item actif (qui ne s'allumerait pas hors route
// /dashboard). Le script de capture screenshot l'element #mockup-canvas a
// deviceScaleFactor 2 → image nette, puis composite dans mockup-pc.png.
//
// On rend frais a chaque requete (dates relatives "il y a X min").
// ─────────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

const MIN = 60_000;
const HOUR = 60 * MIN;

const STATS: Parameters<typeof StatsStrip>[0]["stats"] = [
  {
    label: "Crédits disponibles",
    value: "300,00 €",
    sub: "300 crédits",
  },
  {
    label: "Leads achetés",
    value: "12",
    sub: "ce mois-ci",
    delta: { kind: "delta", value: 33 },
  },
  {
    label: "Leads convertis",
    value: "7",
    sub: "58% conv.",
    delta: { kind: "delta", value: 40 },
  },
  {
    label: "Dépensé ce mois-ci",
    value: "264,00 €",
    sub: "TVAC",
    delta: { kind: "delta", value: 21 },
  },
];

function buildLeads(now: number): AvailableLead[] {
  return [
    {
      assignmentId: "m1",
      leadId: "l1",
      priceCents: 7600,
      createdAt: new Date(now - 9 * MIN),
      urgency: "URGENT",
      city: "Liège",
      postalCode: "4000",
      categoryId: "serrurerie",
      categoryName: "Serrurerie & sécurité",
      subCategoryName: "Dépannage serrure",
      isExclusiveAvailable: false,
      state: "AVAILABLE",
      hasBuyer: false,
    },
    {
      assignmentId: "m2",
      leadId: "l2",
      priceCents: 5400,
      createdAt: new Date(now - 52 * MIN),
      urgency: "SOON",
      city: "Namur",
      postalCode: "5000",
      categoryId: "plomberie",
      categoryName: "Plomberie & chauffage",
      subCategoryName: "Installation chaudière",
      isExclusiveAvailable: false,
      state: "AVAILABLE",
      hasBuyer: false,
    },
    {
      assignmentId: "m3",
      leadId: "l3",
      priceCents: 4800,
      createdAt: new Date(now - 2 * HOUR),
      urgency: "PLANNED",
      city: "Charleroi",
      postalCode: "6000",
      categoryId: "electricite",
      categoryName: "Électricité",
      subCategoryName: "Mise en conformité tableau",
      isExclusiveAvailable: false,
      state: "AVAILABLE",
      hasBuyer: false,
    },
    {
      assignmentId: "m4",
      leadId: "l4",
      priceCents: 6200,
      createdAt: new Date(now - 4 * HOUR),
      urgency: "FLEXIBLE",
      city: "Mons",
      postalCode: "7000",
      categoryId: "serrurerie",
      categoryName: "Serrurerie & sécurité",
      subCategoryName: "Blindage de porte",
      isExclusiveAvailable: false,
      state: "AVAILABLE",
      hasBuyer: false,
    },
    {
      assignmentId: "m5",
      leadId: "l5",
      priceCents: 5200,
      createdAt: new Date(now - 5 * HOUR),
      urgency: "SOON",
      city: "Wavre",
      postalCode: "1300",
      categoryId: "plomberie",
      categoryName: "Plomberie & chauffage",
      subCategoryName: "Remplacement chauffe-eau",
      isExclusiveAvailable: false,
      state: "AVAILABLE",
      hasBuyer: false,
    },
  ];
}

const SETTINGS_CATEGORIES = [
  { id: "serrurerie", name: "Serrurerie & sécurité" },
  { id: "plomberie", name: "Plomberie & chauffage" },
  { id: "electricite", name: "Électricité" },
];

// Construit au chargement du module (pas pendant le render — sinon
// react-hooks/purity rale sur Date.now). Les ages "il y a X min" restent
// frais : le dev recompile a chaque edit, et la capture suit aussitot.
const LEADS = buildLeads(Date.now());

export default function MockupDashboardPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="grid min-h-screen place-items-center bg-slate-300 p-10">
      {/* Canvas figé = zone ecran du laptop (~16:9). Le script capture cet
          element precisement (exclut tout overlay hors-canvas). */}
      <div
        id="mockup-canvas"
        className="flex h-[810px] w-[1440px] overflow-hidden bg-slate-50"
      >
        <MockSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <MockTopBar />

          <div className="flex-1 overflow-hidden px-8 pb-7 pt-6">
            <StatsStrip stats={STATS} />

            <div className="mt-7 grid grid-cols-[1fr_360px] gap-6">
              <AvailableLeadsSection leads={LEADS} totalCount={9} />
              <RightSidebarPanel
                autoAccept
                currentRadiusKm={60}
                categories={SETTINGS_CATEGORIES}
                showQuickActions={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Replique statique de la sidebar (cf. SidebarContent + NavLink) ──────────
const NAV = [
  { icon: SquaresFour, label: "Tableau de bord", active: true },
  { icon: Tray, label: "Leads disponibles", badge: 9 },
  { icon: CheckCircle, label: "Mes demandes", badge: 3 },
  { icon: Wallet, label: "Wallet & Crédits" },
  { icon: User, label: "Profil & Entreprise" },
] as const;

function MockSidebar() {
  return (
    <div className="flex w-[248px] shrink-0 flex-col bg-[var(--color-b2b-dark)]">
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <Logo size={48} showText={false} href="/dashboard" theme="dark" />
        <div className="flex flex-col leading-none">
          <span className="font-display text-[22px] font-bold tracking-tight text-white">
            DevisRapide
          </span>
          <span className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Espace Artisan
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-hidden px-3 pb-4">
        <ul className="flex flex-col gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = "active" in item && item.active;
            return (
              <li key={item.label}>
                <div
                  className={
                    "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] " +
                    (active
                      ? "bg-[var(--color-navy-mid)] font-medium text-white"
                      : "font-medium text-slate-300")
                  }
                >
                  {active && (
                    <span
                      className="absolute -left-3 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--accent)]"
                      aria-hidden
                    />
                  )}
                  <span
                    className={
                      "flex h-5 w-5 shrink-0 items-center justify-center " +
                      (active ? "text-white" : "text-slate-400")
                    }
                    aria-hidden
                  >
                    <Icon size={20} weight={active ? "bold" : "regular"} />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {"badge" in item && item.badge ? (
                    <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-[var(--accent)] px-1.5 py-px text-[11px] font-semibold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
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
          <span className="mt-1 block text-[12px] text-slate-400">
            {CONTACT.EMAIL}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Replique statique de la TopBar greeting (cf. TopBar + UserMenu) ─────────
function MockTopBar() {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-8 py-4">
      <div className="min-w-0">
        <h1 className="font-display truncate text-[30px] font-bold tracking-tight text-slate-900">
          Bonjour Eric,
        </h1>
        <p className="truncate text-[14px] text-slate-600">
          Voici un aperçu de votre activité aujourd&apos;hui.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3 rounded-md px-2 py-1.5">
        <span
          className="grid h-9 w-9 place-items-center rounded-full text-[13px] font-semibold text-white"
          style={{ backgroundColor: "#1e3a8a" }}
        >
          MR
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[14px] font-semibold text-slate-900">
            Multiréférence Métiers SCS
          </span>
          <span className="text-[12px] text-slate-500">Espace artisan</span>
        </span>
      </div>
    </header>
  );
}
