import Link from "next/link";
import { Phone, ChevronDown } from "lucide-react";
import { Logo } from "./Logo";
import { buttonVariants } from "@/components/ui/button";
import { CONTACT } from "@/lib/contact";
import { cn } from "@/lib/utils";

// Header V3 : single white bar sticky h-68. Pas de top strip navy.
// Dropdown "Métiers" : bouton placeholder pour ce sprint (sera relié
// au menu déroulant des catégories à un prochain sprint pour rester
// fidèle au proto qui ne l'expose pas non plus).

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1350px] items-center justify-between gap-4 px-6 py-4">
          <Logo size={44} />

          <nav className="hidden items-center gap-7 text-[14px] font-medium text-slate-700 lg:flex">
            <Link href="#how" className="hover:text-[#1e3a8a]">
              Comment ça marche
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-[#1e3a8a]"
              aria-haspopup="menu"
            >
              Métiers
              <ChevronDown
                className="h-3.5 w-3.5"
                strokeWidth={2}
                aria-hidden
              />
            </button>
            <Link href="/pros" className="hover:text-[#1e3a8a]">
              Pour les pros
            </Link>
            <Link href="#avis" className="hover:text-[#1e3a8a]">
              Avis clients
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 border-r border-slate-200 pr-3 md:flex">
              <Phone
                className="h-[18px] w-[18px] text-[#1e3a8a]"
                strokeWidth={2}
                aria-hidden
              />
              <div className="leading-tight">
                {/* Numero placeholder, tel: desactive tant que vrai numero non defini */}
                <div
                  className="text-[13px] font-semibold text-slate-900"
                  aria-disabled="true"
                >
                  {CONTACT.PHONE_DISPLAY}
                </div>
                <div className="text-[11px] text-slate-500">
                  {CONTACT.HOURS}
                </div>
              </div>
            </div>
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
                "h-10 px-4 text-sm font-medium",
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
