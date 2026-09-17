import { AdminSidebarContent } from "./AdminSidebarContent";

type Props = {
  proProfileId: string | null;
  email: string;
};

/**
 * Sidebar desktop (lg+) du panel admin. Fond charcoal, distinct du navy du
 * dashboard pro pour qu'on sache toujours dans quel espace on se trouve.
 */
export function AdminSidebar({ proProfileId, email }: Props) {
  return (
    <aside className="hidden h-screen w-[260px] shrink-0 flex-col bg-[#1a1f2e] lg:flex">
      <AdminSidebarContent proProfileId={proProfileId} email={email} />
    </aside>
  );
}
