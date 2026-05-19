import Link from "next/link";
import { Check, Image as ImageIcon } from "@phosphor-icons/react/dist/ssr";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MockDashboard } from "./MockDashboard";
import { MockNotification } from "./MockNotification";

const BULLETS = [
  "3 pros max par lead",
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

      <div className="relative mx-auto grid max-w-[1350px] gap-10 px-6 py-12 lg:grid-cols-[1fr_1.1fr] lg:gap-12 lg:py-20">
        <div className="relative z-10 flex flex-col">
          <span
            className="text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] sm:tracking-[0.16em]"
            style={{ color: "#ea580c" }}
          >
            Artisans · Belgique
          </span>
          <h1
            className="font-display mt-3 text-[40px] font-extrabold leading-[1.05] tracking-tight sm:text-[48px] lg:text-[56px]"
            style={{ color: "#1e3a8a", letterSpacing: "-0.035em" }}
          >
            Recevez des chantiers
            <br />
            qualifiés <span style={{ color: "#ea580c" }}>en Belgique</span>
            <br />
            sans prospecter.
          </h1>
          <p className="mt-5 max-w-[480px] text-[15.5px] leading-relaxed text-slate-600">
            La plateforme N°1 en Belgique pour les artisans : nous vous
            envoyons des demandes de devis qualifiées, près de chez vous, que
            vous choisissez d&apos;accepter ou non.
          </p>

          <ul className="mt-7 flex flex-col gap-2.5">
            {BULLETS.map((b) => (
              <li
                key={b}
                className="flex items-center gap-2.5 text-[14px] text-slate-700"
              >
                <span
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full"
                  style={{ backgroundColor: "#1e3a8a" }}
                  aria-hidden
                >
                  <Check size={12} weight="bold" className="text-white" />
                </span>
                {b}
              </li>
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

        {/* Visuel : photo placeholder (ratio 4:5) + mock dashboard +
            notification. Le placeholder garde le ratio cible pour que la
            vraie photo Romain s'insere sans casser le layout. Masque mobile :
            le placeholder gris occuperait quasi tout l'ecran avant l'ajout
            de la vraie photo. */}
        <div className="relative hidden lg:block">
          <div
            className="relative overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200"
            style={{ aspectRatio: "4 / 5" }}
          >
            <div className="absolute inset-0 grid place-items-center">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <ImageIcon size={40} weight="thin" aria-hidden />
                <span className="text-[11px] uppercase tracking-wider">
                  Photo artisan
                </span>
              </div>
            </div>
          </div>

          <div className="absolute -right-2 top-8 hidden w-[58%] lg:block">
            <MockDashboard />
          </div>

          <div className="absolute -bottom-3 -left-3 hidden w-[55%] lg:block">
            <MockNotification
              category="Toiture"
              city="Bruxelles"
              distanceKm={8}
              priceCents={10000}
              exclusif
            />
          </div>
        </div>
      </div>
    </section>
  );
}
