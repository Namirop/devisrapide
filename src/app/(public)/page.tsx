import Image from "next/image";
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { LeadFormHero } from "@/components/ds/LeadFormHero";
import { TrustpilotBadge } from "@/components/ds/TrustpilotBadge";
import { LAUNCH_STATS } from "@/lib/stats-mock";

const TRUST_BADGES = [
  {
    icon: CheckCircle2,
    title: "100% Gratuit",
    sub: "et sans engagement",
  },
  {
    icon: ShieldCheck,
    title: "Artisans vérifiés",
    sub: "et notés par nos clients",
  },
  {
    icon: Sparkles,
    title: "Conseils Primes",
    sub: "Artisans informés des dernières aides",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <section className="grid min-h-[600px] lg:grid-cols-2 lg:min-h-[700px]">
        {/* LEFT — Photo + overlay */}
        <div className="relative min-h-[460px] lg:min-h-[700px]">
          <Image
            src="/images/hero-artisan-800.webp"
            alt="Artisan belge dans son atelier"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/75"
            aria-hidden
          />

          <div className="relative z-10 flex h-full flex-col justify-end gap-6 p-6 text-white sm:p-10 lg:p-12">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-[11px] font-bold uppercase tracking-[1.5px] text-accent-foreground">
              <span
                aria-label="Drapeau belge"
                className="inline-flex h-3 w-4 overflow-hidden rounded-[2px] border border-white/30"
              >
                <span className="w-1/3 bg-black" />
                <span className="w-1/3 bg-wallonie-yellow" />
                <span className="w-1/3 bg-wallonie-red" />
              </span>
              La plateforme N°1 en Belgique pour vos travaux
            </span>

            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Le bon artisan,
              <br />
              sans téléphoner
              <br />
              <span className="text-orange-400">à quinze numéros.</span>
            </h1>

            <p className="max-w-md text-base text-white/85 sm:text-lg">
              Décrivez votre besoin en 2 minutes et recevez jusqu&apos;à
              3 devis gratuits d&apos;artisans vérifiés près de chez vous.
              Comparez, choisissez, c&apos;est tout.
            </p>

            <ul className="grid gap-3 sm:grid-cols-3">
              {TRUST_BADGES.map((b) => (
                <li
                  key={b.title}
                  className="flex items-start gap-2 text-white"
                >
                  <b.icon
                    className="mt-0.5 h-5 w-5 shrink-0 text-orange-400"
                    aria-hidden
                  />
                  <span className="leading-tight">
                    <span className="block text-sm font-semibold">
                      {b.title}
                    </span>
                    <span className="block text-xs text-white/70">
                      {b.sub}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="pt-1">
              <TrustpilotBadge
                rating={LAUNCH_STATS.averageRating.value}
                showLabel
              />
            </div>
          </div>
        </div>

        {/* RIGHT — Form card */}
        <div className="flex items-center justify-center bg-slate-50 p-6 sm:p-10 lg:p-14">
          <LeadFormHero
            monthlyLeads={LAUNCH_STATS.monthlyLeads.value}
          />
        </div>
      </section>

      {/* Placeholder for the rest of the page — sections to come in next commits */}
      <section className="border-t border-border bg-muted py-20">
        <div className="mx-auto max-w-3xl px-4 text-center text-sm text-muted-foreground">
          <p>
            POC palette — sections suivantes (Comment ça marche,
            catégories complètes, témoignages, primes Wallonie,
            B2B, FAQ, footer 4 colonnes) ajoutées dans les commits
            suivants après validation visuelle.
          </p>
        </div>
      </section>
    </>
  );
}
