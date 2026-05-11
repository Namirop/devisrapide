import Link from "next/link";
import { Phone, Clock } from "lucide-react";
import { Logo } from "./Logo";
import { CONTACT } from "@/lib/contact";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NavPublic() {
  return (
    <header className="sticky top-0 z-40">
      <div className="bg-primary text-white text-xs">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-white/90">
              <Phone className="h-3.5 w-3.5" aria-hidden />
              {/* Numéro placeholder — tel: désactivé tant que vrai numéro non défini */}
              <span aria-disabled="true">{CONTACT.PHONE_DISPLAY}</span>
            </span>
            <span className="hidden items-center gap-1.5 text-white/80 sm:inline-flex">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {CONTACT.HOURS}
            </span>
          </div>
          <span className="hidden items-center gap-2 text-white/90 md:inline-flex">
            <span
              aria-label="Drapeau belge"
              className="inline-flex h-3.5 w-5 overflow-hidden rounded-sm border border-white/20"
            >
              <span className="w-1/3 bg-black" />
              <span className="w-1/3 bg-wallonie-yellow" />
              <span className="w-1/3 bg-wallonie-red" />
            </span>
            <span className="font-medium">
              La plateforme N°1 en Belgique
            </span>
          </span>
        </div>
      </div>

      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <Logo size="md" />
          <nav className="hidden items-center gap-6 text-sm font-medium text-foreground/80 lg:flex">
            <Link href="/#comment-ca-marche" className="hover:text-foreground">
              Comment ça marche
            </Link>
            <Link href="/#services" className="hover:text-foreground">
              Nos services
            </Link>
            <Link href="/pros" className="hover:text-foreground">
              Espace pro
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/connexion"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-10 px-4 text-sm",
              )}
            >
              Connexion
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
