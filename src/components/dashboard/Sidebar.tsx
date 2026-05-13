import { SidebarContent } from "./SidebarContent";

type Props = {
  proProfileId: string;
};

/**
 * Sidebar fixe gauche desktop (lg+). Wrapper visuel pour <SidebarContent>
 * qui contient la vraie logique (logo + nav + counts + bottom block).
 * La version mobile drawer est livree par <MobileSidebar> (top bar).
 */
export function Sidebar({ proProfileId }: Props) {
  return (
    <aside className="hidden h-screen w-[260px] shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <SidebarContent proProfileId={proProfileId} />
    </aside>
  );
}
