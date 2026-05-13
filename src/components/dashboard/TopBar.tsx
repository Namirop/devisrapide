import { MobileSidebar } from "./MobileSidebar";
import { SidebarContent } from "./SidebarContent";
import { UserMenu } from "./UserMenu";

type Greeting = {
  firstName: string;
  subtitle: string;
};

type Props = {
  companyName: string;
  email: string;
  proProfileId: string;
  /**
   * Quand fourni, la TopBar passe en mode "expanded" : elle s'agrandit
   * en hauteur et affiche un greeting "Bonjour {firstName}" + subtitle
   * sur la gauche. UserMenu reste a droite. Sur les autres pages, on
   * ne passe pas ce prop → mode compact (juste l'avatar a droite).
   */
  greeting?: Greeting;
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
export function TopBar({
  companyName,
  email,
  proProfileId,
  greeting,
}: Props) {
  if (greeting) {
    return (
      <header className="sticky top-0 z-30 flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-5 sm:items-center sm:px-8 sm:py-6">
        <div className="flex min-w-0 items-start gap-2 sm:items-center">
          <div className="lg:hidden">
            <MobileSidebar>
              <SidebarContent proProfileId={proProfileId} />
            </MobileSidebar>
          </div>
          <div className="min-w-0">
            <h1 className="font-display truncate text-[22px] font-bold tracking-tight text-slate-900 sm:text-[26px] lg:text-[30px]">
              Bonjour{greeting.firstName ? ` ${greeting.firstName}` : ""}
            </h1>
            <p className="mt-1 truncate text-[13px] text-slate-600 sm:text-[14px]">
              {greeting.subtitle}
            </p>
          </div>
        </div>
        <UserMenu companyName={companyName} email={email} />
      </header>
    );
  }

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
