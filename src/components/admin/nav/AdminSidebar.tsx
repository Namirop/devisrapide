import { AdminSidebarContent } from "./AdminSidebarContent";

type Props = {
  proProfileId: string | null;
  email: string;
};

/**
 * Sidebar fixe gauche desktop (lg+) du panel admin. Wrapper visuel
 * pour <AdminSidebarContent>. Charcoal anthracite (bg-[#1a1f2e]),
 * distinct du navy du dashboard pro pour eviter la confusion visuelle.
 *
 * La version mobile drawer est livree par <AdminMobileSidebar>.
 */
export function AdminSidebar({ proProfileId, email }: Props) {
  return (
    <aside className="hidden h-screen w-[260px] shrink-0 flex-col bg-[#1a1f2e] lg:flex">
      <AdminSidebarContent proProfileId={proProfileId} email={email} />
    </aside>
  );
}
