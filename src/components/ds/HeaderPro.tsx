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
        {/* Meme layout que le Header particulier (flex justify-between). */}
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6 lg:py-4">
          {/* Logo plus petit sur mobile (comme la LP particulier) pour eviter
              la compression dans la barre etroite. */}
          <div className="flex shrink-0 items-center">
            <span className="inline-flex translate-y-[4px] sm:hidden">
              <Logo variant="brand" size={26} />
            </span>
            <span className="hidden sm:inline-flex">
              <Logo variant="brand" size={40} />
            </span>
          </div>

          <nav className="hidden items-center gap-8 text-[16px] font-medium text-slate-700 lg:flex">
            <Link href="#potentiel" className="hover:text-[#1e3a8a]">
              Mon potentiel
            </Link>
            <Link href="#comment" className="hover:text-[#1e3a8a]">
              Comment ça marche
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
