import { SidebarContent } from "./SidebarContent";

type Props = {
  proProfileId: string;
};

/** Sidebar desktop (lg+) ; le contenu est partagé avec le drawer mobile. */
export function Sidebar({ proProfileId }: Props) {
  return (
    <aside className="hidden h-screen w-[260px] shrink-0 flex-col bg-[var(--color-b2b-dark)] lg:flex">
      <SidebarContent proProfileId={proProfileId} />
    </aside>
  );
}
