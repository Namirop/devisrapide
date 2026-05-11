import Link from "next/link";
import { Phone } from "lucide-react";
import { Logo } from "./Logo";
import { NavMetiersDropdown } from "./NavMetiersDropdown";
import { CONTACT } from "@/lib/contact";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NavPublic() {
  return (
    <header className="sticky top-0 z-40">
      <div className="bg-primary text-white">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-end px-4 text-xs">
          <span className="inline-flex items-center gap-2 text-white/90">
            <span
              aria-label="Drapeau belge"
              className="inline-flex h-3 w-4 overflow-hidden rounded-[2px] border border-white/20"
            >
              <span className="w-1/3 bg-black" />
              <span className="w-1/3 bg-wallonie-yellow" />
              <span className="w-1/3 bg-wallonie-red" />
            </span>
            <span className="font-medium uppercase tracking-wide">
              La plateforme N°1 en Belgique
            </span>
          </span>
        </div>
      </div>

      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4">
          <Logo size="md" />

          <nav className="hidden items-center gap-7 text-sm font-medium text-foreground/80 lg:flex">
            <Link
              href="/#comment-ca-marche"
              className="hover:text-foreground"
            >
              Comment ça marche
            </Link>
            <NavMetiersDropdown />
            <Link href="/pros" className="hover:text-foreground">
              Pour les pros
            </Link>
            <Link href="/#avis-clients" className="hover:text-foreground">
              Avis clients
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden flex-col text-right text-xs leading-tight text-foreground/70 xl:flex">
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <Phone className="h-3.5 w-3.5 text-primary" aria-hidden />
                <span aria-disabled="true">{CONTACT.PHONE_DISPLAY}</span>
              </span>
              <span className="text-[11px]">{CONTACT.HOURS}</span>
            </span>
            <Link
              href="/connexion"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-10 px-4 text-sm",
              )}
            >
              Espace pro
            </Link>
            <Link
              href="/demande"
              className={cn(
                buttonVariants(),
                "h-10 bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent/90",
              )}
            >
              Demander un devis
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
