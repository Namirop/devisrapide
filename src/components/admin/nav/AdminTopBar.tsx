import { AdminMobileSidebar } from "./AdminMobileSidebar";
import { AdminSidebarContent } from "./AdminSidebarContent";
import { AdminUserMenu } from "./AdminUserMenu";

type Greeting = {
  firstName: string;
  subtitle: string;
};

type Props = {
  email: string;
  firstName: string | null;
  proProfileId: string | null;
  /**
   * Quand fourni (home /admin), la TopBar passe en mode "expanded" : elle
   * s'agrandit en hauteur et affiche un greeting "Bonjour {firstName}" +
   * subtitle a gauche, AdminUserMenu a droite — meme pattern que le
   * dashboard pro home. Sur les autres pages, prop absent → mode compact
   * (juste l'avatar a droite).
   */
  greeting?: Greeting;
};

/**
 * TopBar du panel admin. Server Component qui recoit les donnees deja
 * chargees par le layout parent. Sticky top, fond blanc, border bottom
 * slate-200.
 *
 * Mobile (< lg) : bouton hamburger qui ouvre la sidebar admin en drawer.
 * AdminUserMenu a droite avec avatar + label "Espace Admin".
 */
export function AdminTopBar({ email, firstName, proProfileId, greeting }: Props) {
  if (greeting) {
    return (
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-8 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">
            <AdminMobileSidebar>
              <AdminSidebarContent proProfileId={proProfileId} email={email} />
            </AdminMobileSidebar>
          </div>
          <div className="min-w-0">
            <h1 className="font-display truncate text-[22px] font-bold tracking-tight text-slate-900 sm:text-[26px] lg:text-[30px]">
              Bonjour{greeting.firstName ? ` ${greeting.firstName},` : ""}
            </h1>
            <p className="truncate text-[13px] text-slate-600 sm:text-[14px]">
              {greeting.subtitle}
            </p>
          </div>
        </div>
        <AdminUserMenu email={email} firstName={firstName} />
      </header>
    );
  }

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
