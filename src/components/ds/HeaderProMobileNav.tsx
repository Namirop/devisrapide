"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { List, X } from "@phosphor-icons/react";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Drawer mobile pour le HeaderPro (pages publiques artisan). Visible < lg.
// Mirroir de HeaderMobileNav (Header particulier) — meme pattern : Sheet
// shadcn + auto-close au clic sur lien + pattern previous-render pour
// fermer sur navigation. Liens : ancres /pros + CTA "S'identifier".

const NAV_LINKS = [
  { href: "#potentiel", label: "Mon potentiel" },
  { href: "#comment", label: "Comment ça marche" },
  { href: "#faq", label: "FAQ" },
];

export function HeaderProMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    if (open) setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Ouvrir le menu"
        className="grid h-10 w-10 place-items-center rounded-md text-slate-700 transition-colors hover:bg-slate-100 lg:hidden"
      >
        <List size={22} weight="regular" aria-hidden />
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-[280px] bg-white p-0"
      >
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-end px-3 py-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
              className="grid h-9 w-9 place-items-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
            >
              <X size={20} weight="regular" aria-hidden />
            </button>
          </div>

          <nav className="flex flex-col gap-0.5 px-3">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-[15px] font-medium text-slate-800 transition-colors hover:bg-slate-50 hover:text-[#1e3a8a]"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="mx-3 my-4 h-px bg-slate-100" />

          <div className="px-3">
            <Link
              href="/connexion"
              onClick={() => setOpen(false)}
              className="block rounded-md border border-slate-200 px-3 py-2.5 text-center text-[14px] font-medium text-slate-800 transition-colors hover:bg-slate-50"
            >
              S&apos;identifier
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
