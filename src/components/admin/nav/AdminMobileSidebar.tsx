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
  children: ReactNode;
};

/** Drawer mobile (< lg) de la sidebar admin, calqué sur `MobileSidebar`. */
export function AdminMobileSidebar({ children }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fermeture à la navigation via l'état du rendu précédent (pattern React
  // documenté) plutôt qu'un setState dans un useEffect.
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
        className="w-[260px] border-0 bg-[#1a1f2e] p-0"
      >
        <SheetTitle className="sr-only">Navigation admin</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
