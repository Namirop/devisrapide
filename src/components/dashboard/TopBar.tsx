import { Bell } from "lucide-react";

import { UserMenu } from "./UserMenu";

type Props = {
  companyName: string;
  email: string;
};

/**
 * TopBar dashboard. Server Component qui recoit les donnees deja chargees
 * par le layout parent (pas de fetch ici pour eviter le double round-trip).
 *
 * - Sticky top, fond blanc, border bottom slate-200.
 * - Cloche notifications visuelle V1 (pas de badge cluster — push pas
 *   implemente, on attache un compteur de PENDING en Sprint 5 polish).
 * - UserMenu (Client Component) avec avatar initiales + dropdown.
 */
export function TopBar({ companyName, email }: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-[64px] items-center justify-end gap-3 border-b border-slate-200 bg-white px-6">
      <button
        type="button"
        aria-label="Notifications"
        className="relative grid h-9 w-9 place-items-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      </button>
      <UserMenu companyName={companyName} email={email} />
    </header>
  );
}
