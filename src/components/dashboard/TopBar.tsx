import { Bell } from "@phosphor-icons/react/dist/ssr";

import { MobileSidebar } from "./MobileSidebar";
import { SidebarContent } from "./SidebarContent";
import { UserMenu } from "./UserMenu";

type Props = {
  companyName: string;
  email: string;
  proProfileId: string;
};

/**
 * TopBar dashboard. Server Component qui recoit les donnees deja chargees
 * par le layout parent (pas de fetch ici pour eviter le double round-trip).
 *
 * - Sticky top, fond blanc, border bottom slate-200.
 * - Mobile (< lg) : bouton hamburger qui ouvre la Sidebar en Sheet drawer.
 * - Cloche notifications visuelle V1 (pas de badge cluster — push pas
 *   implemente, on attache un compteur de PENDING en Sprint 5 polish).
 * - UserMenu (Client Component) avec avatar initiales + dropdown.
 */
export function TopBar({ companyName, email, proProfileId }: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-[64px] items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-8">
      <div className="flex items-center gap-2 lg:hidden">
        <MobileSidebar>
          <SidebarContent proProfileId={proProfileId} />
        </MobileSidebar>
      </div>
      <div className="hidden flex-1 lg:block" />
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid h-9 w-9 place-items-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <Bell size={20} weight="regular" aria-hidden />
        </button>
        <UserMenu companyName={companyName} email={email} />
      </div>
    </header>
  );
}
