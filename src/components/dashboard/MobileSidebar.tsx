"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { List } from "@phosphor-icons/react";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Props = {
  /**
   * SidebarContent pre-rendered server-side passé en children.
   * Permet au drawer mobile de ne pas dupliquer les fetches Prisma
   * cote layout — react se charge de la composition.
   */
  children: ReactNode;
};

/**
 * Drawer mobile pour la sidebar. Bouton hamburger affiche < lg seulement
 * (le Sidebar fixe prend la place sur lg+). Ferme automatiquement quand
 * l'utilisateur navigue vers un item de la sidebar (changement pathname).
 */
export function MobileSidebar({ children }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close sur navigation : quand on clique un NavLink interne,
  // le pathname change → on referme le drawer. Intentionnel : c'est
  // exactement le pattern recommande pour "sync external system"
  // (ici l'etat ouverture du Sheet) avec une valeur externe (pathname).
  // Le `if (open)` evite le re-render inutile quand le drawer est
  // deja ferme (autre cas que clic NavLink, ex: navigation arriere).
  useEffect(() => {
    if (open) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Ouvrir la navigation"
        className="grid h-9 w-9 place-items-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
      >
        <List size={20} weight="regular" aria-hidden />
      </SheetTrigger>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-[260px] border-0 bg-[var(--color-b2b-dark)] p-0"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
