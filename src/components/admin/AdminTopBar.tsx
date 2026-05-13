import { AdminMobileSidebar } from "./AdminMobileSidebar";
import { AdminSidebarContent } from "./AdminSidebarContent";
import { AdminUserMenu } from "./AdminUserMenu";

type Props = {
  email: string;
  firstName: string | null;
  proProfileId: string | null;
};

/**
 * TopBar du panel admin. Server Component qui recoit les donnees deja
 * chargees par le layout parent. Sticky top, fond blanc, border bottom
 * slate-200, hauteur compacte (pas de greeting comme sur le dashboard
 * pro home).
 *
 * Mobile (< lg) : bouton hamburger qui ouvre la sidebar admin en drawer.
 * AdminUserMenu a droite avec avatar + label "Espace Admin".
 */
export function AdminTopBar({ email, firstName, proProfileId }: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-[64px] items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-8">
      <div className="flex items-center gap-2 lg:hidden">
        <AdminMobileSidebar>
          <AdminSidebarContent proProfileId={proProfileId} email={email} />
        </AdminMobileSidebar>
      </div>
      <div className="hidden flex-1 lg:block" />
      <AdminUserMenu email={email} firstName={firstName} />
    </header>
  );
}
