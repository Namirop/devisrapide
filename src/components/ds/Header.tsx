import Link from "next/link";

import { HeaderMobileNav } from "./HeaderMobileNav";
import { Logo } from "./Logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Header public unique, decline par `variant` : "client" (LP particulier +
// pages legales + 404) et "pro" (landing artisan /pros). Seuls les liens de
// nav et les 2 CTAs changent ; tout le layout (barre blanche sticky h~65/73px,
// logo brand responsive, drawer mobile) est partage. Le route group
// (pro-public) monte <Header variant="pro" />, les autres <Header />.

type NavLink = { href: string; label: string };
type Cta = { href: string; label: string };
type HeaderVariant = "client" | "pro";

type HeaderConfig = {
  navLinks: ReadonlyArray<NavLink>;
  // secondaryCta : bouton outline (desktop) ET lien du drawer mobile.
  secondaryCta: Cta;
  // primaryCta : bouton accent (conversion).
  primaryCta: Cta;
};

const CONFIG: Record<HeaderVariant, HeaderConfig> = {
  client: {
    navLinks: [
      { href: "/#how", label: "Comment ça marche" },
      { href: "/#categories", label: "Services" },
      { href: "/pros", label: "Pour les pros" },
      { href: "/#faq", label: "FAQ" },
    ],
    secondaryCta: { href: "/connexion", label: "Espace pro" },
    primaryCta: { href: "/demande", label: "Demander un devis" },
  },
  pro: {
    navLinks: [
      { href: "#potentiel", label: "Mon potentiel" },
      { href: "#comment", label: "Comment ça marche" },
      { href: "#faq", label: "FAQ" },
    ],
    secondaryCta: { href: "/connexion", label: "S'identifier" },
    primaryCta: { href: "/inscription-pro", label: "S'inscrire gratuitement" },
  },
};

export function Header({ variant = "client" }: { variant?: HeaderVariant }) {
  const { navLinks, secondaryCta, primaryCta } = CONFIG[variant];

  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6 lg:py-4">
          {/* Logo plus petit sur mobile pour eviter la compression dans la
              barre etroite. shrink-0 garantit qu'il ne se deforme jamais. */}
          <div className="flex shrink-0 items-center">
            <span className="inline-flex translate-y-[4px] sm:hidden">
              <Logo variant="brand" size={26} />
            </span>
            <span className="hidden sm:inline-flex">
              <Logo variant="brand" size={40} />
            </span>
          </div>

          <nav className="hidden items-center gap-8 text-[16px] font-medium text-slate-700 lg:flex">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-[#1e3a8a]">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={secondaryCta.href}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "hidden h-10 px-4 text-sm sm:inline-flex",
              )}
            >
              {secondaryCta.label}
            </Link>
            <Link
              href={primaryCta.href}
              className={cn(
                buttonVariants({ variant: "accent" }),
                "h-9 px-3 text-[13px] font-medium lg:h-10 lg:px-4 lg:text-sm",
              )}
            >
              {primaryCta.label}
            </Link>
            <HeaderMobileNav navLinks={navLinks} cta={secondaryCta} />
          </div>
        </div>
      </div>
    </header>
  );
}
