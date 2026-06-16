import Image from "next/image";
import Link from "next/link";

import { HeroNotifications } from "@/components/ds/pro/HeroNotifications";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BULLETS = [
  "3 pros max par lead ou option d'exclusivité",
  "Sans abonnement, payez ce que vous acceptez",
  "Zone et métiers 100% personnalisables",
] as const;

export function ProHero() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Grille technique en fond — limitee au Hero (signature visuelle
          de la zone d'impact, comme la LP particulier). */}
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern"
        aria-hidden
      />

      {/* Fade vertical en bas du Hero : compresse l'halo visible aux ~40%
          du bas via stop a 60%. Dissout la grille + bg-white dans le
          slate-50 de la section suivante. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-16 bg-[linear-gradient(to_bottom,transparent_60%,#f8fafc_100%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1400px] px-6 py-12 lg:py-13">
        <div className="relative z-10 flex max-w-[770px] flex-col">
          <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-slate-500 sm:text-[13px]">
            Artisans · Belgique
          </span>
          <h1
            className="mt-3 text-balance text-[40px] font-extrabold leading-[1.00] tracking-tight sm:text-[44px] md:text-[60px] lg:text-[54px] xl:text-[69px]"
            style={{
              color: "#1e3a8a",
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.035em",
            }}
          >
            Recevez des chantiers qualifiés en Belgique{" "}
            <span style={{ color: "#ea580c" }}>sans prospecter.</span>
          </h1>
          <p className="mt-5 max-w-[480px] text-[15.5px] leading-relaxed text-slate-600">
            Une plateforme conçue pour les artisans belges : nous vous envoyons
            des demandes de devis qualifiées, près de chez vous, que vous
            choisissez d&apos;accepter ou non.
          </p>

          <ul className="mt-7 space-y-2 text-[14px] text-slate-700">
            {BULLETS.map((b) => (
              <li key={b}>· {b}</li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/inscription-pro"
              className={cn(
                buttonVariants({ variant: "accent" }),
                "h-12 px-6 text-[15px] font-semibold",
              )}
            >
              S&apos;inscrire gratuitement
            </Link>
            <span className="text-[12px] text-slate-500">
              Gratuit à l&apos;inscription · Sans engagement · 100% Belge
            </span>
          </div>
        </div>

        {/* Visuel produit : mockup PC du dashboard. Desktop : absolu a droite,
            taille/position independantes du texte (le h1 peut donc passer au-
            dessus sans rogner le laptop). Mobile : en flux, sous le texte.
            relative → ancre les notifs flottantes (HeroNotifications). */}
        <div className="relative mt-10 lg:absolute lg:right-[0%] lg:top-[64%] lg:z-0 lg:mt-0 lg:w-[60%] lg:-translate-y-1/2 xl:w-[55%]">
          <Image
            src="/dashboard-mockup.webp"
            alt="Le tableau de bord DevisRapide ouvert sur un ordinateur portable"
            width={2600}
            height={1462}
            priority
            sizes="(min-width: 1024px) 62vw, 100vw"
            className="h-auto w-full"
          />
          {/* Notifs flottantes desktop-only autour du laptop. */}
          <HeroNotifications />
        </div>
      </div>
    </section>
  );
}
