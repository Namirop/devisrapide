import Link from "next/link";

import { HeaderMobileNav } from "./HeaderMobileNav";
import { Logo } from "./Logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Header V3 : single white bar sticky h-68. Pas de top strip navy.
// Dropdown "Métiers" : bouton placeholder pour ce sprint (sera relié
// au menu déroulant des catégories à un prochain sprint pour rester
// fidèle au proto qui ne l'expose pas non plus).

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1350px] items-center justify-between gap-4 px-6 py-3 lg:py-4">
          <Logo size={44} wordmarkClassName="hidden sm:inline-block" />

          <nav className="hidden items-center gap-8 text-[16px] font-medium text-slate-700 lg:flex">
            <Link href="/#how" className="hover:text-[#1e3a8a]">
              Comment ça marche
            </Link>
            <Link href="/#categories" className="hover:text-[#1e3a8a]">
              Métiers
            </Link>
            <Link href="/#b2b" className="hover:text-[#1e3a8a]">
              Pour les pros
            </Link>
            <Link href="/#avis" className="hover:text-[#1e3a8a]">
              Avis clients
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/connexion"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "hidden h-10 px-4 text-sm sm:inline-flex",
              )}
            >
              Espace pro
            </Link>
            <Link
              href="/demande"
              className={cn(
                buttonVariants({ variant: "accent" }),
                "h-9 px-3 text-[13px] font-medium lg:h-10 lg:px-4 lg:text-sm",
              )}
            >
              Demander un devis
            </Link>
            <HeaderMobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
