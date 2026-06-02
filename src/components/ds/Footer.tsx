import Link from "next/link";
import { Logo } from "./Logo";
import { BEFlag } from "./BEFlag";
import { CONTACT } from "@/lib/contact";

// Footer — bg navy fonce #0f1f4d, 4 colonnes + bande paiements + copyright.
// Le logo PNG est inverse en silhouette blanche via filter CSS
// (brightness-0 + invert-1) pour rester lisible sur fond sombre.

const SERVICES = [
  { label: "Travaux & Rénovation", href: "/demande" },
  { label: "Entreprises & Copropriétés", href: "/#b2b" },
  { label: "Dépannage 24/7", href: "/demande?universe=urgence-services" },
];

// Liste plate de communes — rendue en grille 2 colonnes par ZonesColumn
// (pas de liens : ce sont des repères de couverture, pas des pages).
const ZONES = [
  "Bruxelles",
  "Liège",
  "Charleroi",
  "Namur",
  "Mons",
  "Arlon",
  "Tournai",
  "Verviers",
  "Wavre",
  "La Louvière",
];

const PROS = [
  { label: "Inscription professionnelle", href: "/inscription-pro" },
  { label: "Comment ça marche ?", href: "/pros" },
  { label: "Tarification", href: "/pros" },
  { label: "Connexion Pro", href: "/connexion" },
];

const ABOUT = [
  { label: "Guide des primes", href: "/#primes" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: `mailto:${CONTACT.EMAIL}` },
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

function ZonesColumn() {
  return (
    <div>
      <h4 className="text-[13px] font-semibold uppercase tracking-wider text-white">
        Zones desservies
      </h4>
      <ul className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2.5 text-[13px] text-white/75">
        {ZONES.map((z) => (
          <li key={z}>{z}</li>
        ))}
      </ul>
      <p className="mt-3.5 text-[12px] font-medium text-white/55">
        + 250 autres communes desservies
      </p>
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
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1.2fr_1.3fr_0.95fr]">
          <div className="col-span-2 lg:col-span-1">
            {/* PNG logo inverse en silhouette blanche pour lisibilite sur navy */}
            <div className="inline-block [&_img]:brightness-0 [&_img]:invert">
              <Logo size={36} theme="dark" href={null} />
            </div>
            <p className="mt-4 max-w-[260px] text-[13px] leading-relaxed text-white/70">
              La plateforme belge pour trouver le bon professionnel pour vos
              travaux.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-[12px] text-white/80">
              <BEFlag className="inline-block h-3 w-4 rounded-[1px]" />
              Wallonie &amp; Bruxelles
            </div>
          </div>

          <Column title="Nos services" items={SERVICES} />
          <Column title="Espace professionnel" items={PROS} />
          <ZonesColumn />
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
              <PayBadge label="VISA" bg="#1a1f71" />
              <PayBadge mc />
              <PayBadge label="stripe" bg="#635bff" />
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
                CGU Clients
              </Link>
            </li>
            <li>
              <Link href="/cgu-pros" className="hover:text-white">
                CGU Pros
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
