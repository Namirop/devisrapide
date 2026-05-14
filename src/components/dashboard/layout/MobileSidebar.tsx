"use client";

import { useState, type ReactNode } from "react";
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

  // Auto-close sur navigation interne : pattern React idiomatique
  // "Storing information from previous renders" (cf. React docs).
  // Quand l'utilisateur clique un NavLink, le pathname change -> on
  // referme le drawer. Evite useEffect + setState (anti-pattern
  // react-hooks/set-state-in-effect). React detecte le setState pendant
  // render, bail-out si valeur identique, sinon re-render synchrone
  // immediat avec le nouveau state.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (open) setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Ouvrir la navigation"
        className="grid h-11 w-11 place-items-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
      >
        <List size={26} weight="regular" aria-hidden />
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
