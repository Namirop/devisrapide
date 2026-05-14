import Link from "next/link";
import { Logo } from "./Logo";
import { BEFlag } from "./BEFlag";
import { CONTACT } from "@/lib/contact";

// Footer — bg navy fonce #0f1f4d, 4 colonnes + bande paiements + copyright.
// Le logo PNG est inverse en silhouette blanche via filter CSS
// (brightness-0 + invert-1) pour rester lisible sur fond sombre.

const SERVICES = [
  { label: "Particuliers", sub: "Devis gratuits", href: "/demande" },
  {
    label: "B2B & Copropriétés",
    sub: "Bientôt — Syndics, Bureaux",
    href: "/#b2b",
  },
  {
    label: "SOS Dépannage 24/7",
    sub: "Urgences",
    href: "/demande?universe=urgence-services",
  },
];

const REGIONS = [
  { label: "Bruxelles", sub: "19 communes" },
  { label: "Wallonie", sub: "Liège, Namur, Charleroi" },
  { label: "Brabant Wallon" },
  { label: "Hainaut" },
  { label: "Luxembourg" },
];

const PROS = [
  { label: "Inscription Artisan", href: "/inscription-pro" },
  { label: "Comment ça marche ?", href: "/pros#comment" },
  { label: "Pourquoi choisir DevisRapide", href: "/pros#pourquoi-choisir" },
  { label: "Connexion Pro", href: "/connexion" },
];

const ABOUT = [
  {
    label: "Guide des Primes",
    sub: "Wallonie & Bruxelles",
    href: "/#primes",
  },
  { label: "Contactez-nous", href: `mailto:${CONTACT.EMAIL}` },
  { label: "FAQ", sub: "Questions fréquentes", href: "/pros#faq" },
];

type ColumnLink = {
  label: string;
  sub?: string;
  href?: string;
  external?: boolean;
};

function Column({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<ColumnLink>;
}) {
  return (
    <div>
      <h4 className="text-[13px] font-semibold uppercase tracking-wider text-white">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5 text-[13px] text-white/75">
        {items.map((it) => {
          const content = (
            <>
              {it.label}
              {it.sub && <span className="text-white/45"> ({it.sub})</span>}
            </>
          );
          if (!it.href)
            return (
              <li key={it.label} className="text-white/75">
                {content}
              </li>
            );
          return (
            <li key={it.label}>
              <Link
                href={it.href}
                {...(it.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="hover:text-white"
              >
                {content}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PayBadge({
  label,
  bg,
  mc,
}: {
  label?: string;
  bg?: string;
  mc?: boolean;
}) {
  if (mc) {
    return (
      <span
        className="inline-flex h-7 items-center rounded-sm bg-white px-2"
        aria-label="Mastercard"
      >
        <span className="-mr-1.5 h-4 w-4 rounded-full bg-[#eb001b]" />
        <span className="h-4 w-4 rounded-full bg-[#f79e1b] mix-blend-multiply" />
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-7 items-center rounded-sm px-2 text-[11px] font-bold tracking-wide text-white"
      style={{ backgroundColor: bg }}
    >
      {label}
    </span>
  );
}

export function Footer() {
  return (
    <footer className="text-white" style={{ backgroundColor: "#0f1f4d" }}>
      <div className="mx-auto max-w-[1350px] px-6 pb-5 pt-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            {/* PNG logo inverse en silhouette blanche pour lisibilite sur navy */}
            <div className="inline-block [&_img]:brightness-0 [&_img]:invert">
              <Logo size={36} theme="dark" href={null} />
            </div>
            <p className="mt-4 max-w-[260px] text-[13px] leading-relaxed text-white/70">
              La plateforme n°1 en Belgique pour trouver le bon artisan au bon
              moment.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-[12px] text-white/80">
              <BEFlag className="inline-block h-3 w-4 rounded-[1px]" />
              Plateforme 100% Belge
            </div>
            <p className="mt-1 text-[12px] italic text-white/45">
              Bientôt en Flandre
            </p>
          </div>

          <Column title="Nos services" items={SERVICES} />
          <Column title="Régions desservies" items={REGIONS} />
          <Column title="Espace professionnel" items={PROS} />
          <Column title="DevisRapide" items={ABOUT} />
        </div>

        <div className="mt-5 h-px bg-white/10" />

        <div className="mt-3 flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[11px] uppercase tracking-wider text-white/55">
              Paiement sécurisé
            </span>
            <div className="flex items-center gap-2">
              <PayBadge label="Bancontact" bg="#005599" />
              <PayBadge label="stripe" bg="#635bff" />
              <PayBadge label="VISA" bg="#1a1f71" />
              <PayBadge mc />
            </div>
          </div>

          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-white/65">
            <li>
              <Link href="/mentions-legales" className="hover:text-white">
                Mentions légales
              </Link>
            </li>
            <li>
              <Link href="/cgu-clients" className="hover:text-white">
                CGU
              </Link>
            </li>
            <li>
              <Link href="/confidentialite" className="hover:text-white">
                Politique de confidentialité
              </Link>
            </li>
            <li>
              <Link href="/cookies" className="hover:text-white">
                Cookies
              </Link>
            </li>
          </ul>

          <div className="text-[12px] text-white/55">
            © {new Date().getFullYear()} DevisRapide — Tous droits réservés
          </div>
        </div>
      </div>
    </footer>
  );
}
