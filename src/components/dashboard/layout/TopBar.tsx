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
  /** Fourni sur l'accueil du dashboard : en-tête agrandi avec salutation. */
  greeting?: Greeting;
};

/**
 * Barre supérieure du dashboard. Reçoit les données déjà chargées par le
 * layout ; sous lg, embarque le drawer de navigation.
 */
export function TopBar({ companyName, email, proProfileId, greeting }: Props) {
  if (greeting) {
    return (
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-8 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">
            <MobileSidebar>
              <SidebarContent proProfileId={proProfileId} />
            </MobileSidebar>
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
