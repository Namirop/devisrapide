import Link from "next/link";
import { Lock, CreditCard } from "lucide-react";
import { Logo } from "./Logo";

// lucide-react v1.14 ne livre plus les icones de marque (FB/IG/LI) pour des
// raisons de trademark. SVG inline simples (glyphes connus, monochrome).
function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.99 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}
function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

type LinkItem = { label: string; href: string; sub?: string };

const SERVICES: LinkItem[] = [
  { label: "Particuliers", href: "/demande", sub: "Devis gratuits" },
  {
    label: "B2B & Copropriétés",
    href: "/#b2b",
    sub: "Syndics, Bureaux, Commerces",
  },
  {
    label: "SOS Dépannage 24/7",
    href: "/demande?universe=sos-depannage",
    sub: "Urgences",
  },
];

const REGIONS: LinkItem[] = [
  { label: "Bruxelles", href: "#", sub: "19 communes" },
  { label: "Wallonie", href: "#", sub: "Liège, Namur, Charleroi" },
  { label: "Brabant Wallon", href: "#" },
  { label: "Hainaut", href: "#" },
  { label: "Luxembourg", href: "#" },
];

const PROS: LinkItem[] = [
  { label: "Inscription Artisan", href: "/inscription-pro" },
  { label: "Comment ça marche ?", href: "/pros#comment-ca-marche" },
  { label: "Tarifs & Système de crédits", href: "/pros#tarifs" },
  { label: "Connexion Pro", href: "/connexion" },
];

const ABOUT: LinkItem[] = [
  { label: "À propos de nous", href: "/#a-propos" },
  {
    label: "Guide des Primes",
    href: "https://energie.wallonie.be/",
    sub: "Wallonie & Bruxelles",
  },
  { label: "Contactez-nous", href: "/#contact" },
  { label: "FAQ", href: "/#faq", sub: "Questions fréquentes" },
];

function Column({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<LinkItem>;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5 text-sm">
        {items.map((it) => (
          <li key={it.label}>
            <Link
              href={it.href}
              className="text-muted-foreground hover:text-foreground"
              {...(it.href.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              <span className="block font-medium text-foreground/90">
                {it.label}
              </span>
              {it.sub && (
                <span className="block text-xs text-muted-foreground">
                  {it.sub}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Logo size="md" />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              La plateforme n°1 en Belgique pour trouver le bon
              artisan au bon moment.
            </p>
            <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-foreground">
              <span
                aria-label="Drapeau belge"
                className="inline-flex h-3 w-4 overflow-hidden rounded-[2px] border border-border"
              >
                <span className="w-1/3 bg-black" />
                <span className="w-1/3 bg-wallonie-yellow" />
                <span className="w-1/3 bg-wallonie-red" />
              </span>
              Plateforme 100% Belge
            </p>
            <div className="mt-5 flex gap-3">
              {[
                { icon: FacebookIcon, label: "Facebook", href: "#" },
                { icon: InstagramIcon, label: "Instagram", href: "#" },
                { icon: LinkedinIcon, label: "LinkedIn", href: "#" },
              ].map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </Link>
              ))}
            </div>
          </div>

          <Column title="Nos services" items={SERVICES} />
          <Column title="Régions desservies" items={REGIONS} />
          <Column title="Espace professionnel" items={PROS} />
          <Column title="DevisRapide" items={ABOUT} />
        </div>

        <p className="mt-6 text-xs italic text-muted-foreground lg:ml-[20%]">
          Bientôt en Flandre
        </p>
      </div>

      <div className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-primary" aria-hidden />
            <span className="font-medium text-foreground">
              Paiement sécurisé
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" aria-hidden />
              Bancontact · Visa · Mastercard · Stripe
            </span>
          </div>
          <nav className="flex flex-wrap gap-3">
            <Link href="/mentions-legales" className="hover:text-foreground">
              Mentions légales
            </Link>
            <span aria-hidden>·</span>
            <Link href="/cgu-clients" className="hover:text-foreground">
              CGU
            </Link>
            <span aria-hidden>·</span>
            <Link href="/confidentialite" className="hover:text-foreground">
              Politique de confidentialité
            </Link>
            <span aria-hidden>·</span>
            <Link href="/cookies" className="hover:text-foreground">
              Cookies
            </Link>
          </nav>
          <p>© {year} DevisRapide · Tous droits réservés</p>
        </div>
      </div>
    </footer>
  );
}
