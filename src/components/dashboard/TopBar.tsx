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
 * - UserMenu (Client Component) avec avatar initiales + dropdown (le
 *   logout vit dans ce menu, pas dans la sidebar).
 *
 * Pas de cloche notifications : aucun systeme de push branche pour le
 * MVP (planifie Sprint 5 — VAPID + web-push + SW). On l'ajoutera quand
 * il y aura quelque chose a notifier.
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
      <UserMenu companyName={companyName} email={email} />
    </header>
  );
}
