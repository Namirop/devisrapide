import Link from "next/link";
import { HeaderProMobileNav } from "./HeaderProMobileNav";
import { Logo } from "./Logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// HeaderPro — variante du Header pour les pages pro (landing /pros).
// Nav et CTAs orientés artisan : pas de telephone client, pas de lien
// Avis clients particulier. CTAs droite = S'identifier + S'inscrire.

export function HeaderPro() {
  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1350px] items-center justify-between gap-4 px-6 py-3 lg:py-4">
          <Logo size={44} wordmarkClassName="hidden sm:inline-block" />

          <nav className="hidden items-center gap-8 text-[16px] font-medium text-slate-700 lg:flex">
            <Link href="#comment" className="hover:text-[#1e3a8a]">
              Comment ça marche
            </Link>
            <Link href="#potentiel" className="hover:text-[#1e3a8a]">
              Mon potentiel
            </Link>
            <Link href="#temoignages" className="hover:text-[#1e3a8a]">
              Avis artisans
            </Link>
            <Link href="#faq" className="hover:text-[#1e3a8a]">
              FAQ
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
              S&apos;identifier
            </Link>
            <Link
              href="/inscription-pro"
              className={cn(
                buttonVariants({ variant: "accent" }),
                "h-9 px-3 text-[13px] font-medium lg:h-10 lg:px-4 lg:text-sm",
              )}
            >
              S&apos;inscrire gratuitement
            </Link>
            <HeaderProMobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
