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
  /** Fourni sur l'accueil admin : en-tête agrandi avec salutation. */
  greeting?: Greeting;
};

/**
 * Barre supérieure du panel admin. Reçoit les données déjà chargées par le
 * layout ; sous lg, embarque le drawer de navigation.
 */
export function AdminTopBar({
  email,
  firstName,
  proProfileId,
  greeting,
}: Props) {
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
