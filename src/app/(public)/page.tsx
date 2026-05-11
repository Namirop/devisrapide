import { Users, FileText, Star, Clock, CheckCircle2 } from "lucide-react";
import { LeadFormHero } from "@/components/ds/LeadFormHero";
import { StatCard } from "@/components/ds/StatCard";
import { TrustpilotBadge } from "@/components/ds/TrustpilotBadge";
import { LAUNCH_STATS } from "@/lib/stats-mock";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-muted to-background">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-2 lg:gap-12 lg:py-20">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Service belge, basé à Bruxelles
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Le bon artisan,<br />
              <span className="text-primary">sans téléphoner</span>
              <br />
              <span className="text-accent">à quinze numéros.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Décrivez votre besoin en 2 minutes. Des artisans qualifiés
              près de chez vous vous rappellent sous quelques heures —
              gratuit, sans engagement.
            </p>

            <ul className="mt-6 grid gap-2 text-sm font-medium text-foreground sm:grid-cols-2">
              {[
                "Artisans vérifiés (TVA, assurances)",
                "Plusieurs devis en moins de 24h",
                "Service 100% gratuit pour le client",
                "Couverture Bruxelles + Wallonie",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <TrustpilotBadge rating={LAUNCH_STATS.averageRating.value} />
              <span className="text-sm text-muted-foreground">
                Note moyenne au lancement
              </span>
            </div>
          </div>

          <div className="lg:pl-4">
            <LeadFormHero />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background py-10">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            value={`${LAUNCH_STATS.verifiedPros.value}`}
            label={LAUNCH_STATS.verifiedPros.label}
          />
          <StatCard
            icon={FileText}
            value={`${LAUNCH_STATS.monthlyLeads.value}`}
            label={LAUNCH_STATS.monthlyLeads.label}
          />
          <StatCard
            icon={Star}
            value={`${LAUNCH_STATS.averageRating.value.toString().replace(".", ",")}/5`}
            label={LAUNCH_STATS.averageRating.label}
          />
          <StatCard
            icon={Clock}
            value={`${LAUNCH_STATS.averageDelayHours.value}h`}
            label={LAUNCH_STATS.averageDelayHours.label}
          />
        </div>
      </section>

      {/* POC : reste de la landing à coder dans les commits suivants */}
      <section className="border-t border-border bg-muted py-20">
        <div className="mx-auto max-w-3xl px-4 text-center text-sm text-muted-foreground">
          <p>
            POC palette — les sections {`«`} Comment ça marche {`»`},
            {` `}Catégories complètes, Témoignages, Primes Wallonie, B2B, FAQ
            {` `}et le footer 4-colonnes seront ajoutées dans les commits
            suivants après validation visuelle.
          </p>
        </div>
      </section>
    </>
  );
}
