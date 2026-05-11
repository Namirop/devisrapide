"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getMetierIcon, type MetierSlug } from "./MetierIcon";
import { HeroStepper } from "./HeroStepper";

const HERO_CATEGORIES: ReadonlyArray<{
  slug: MetierSlug;
  label: string;
  universe: "travaux" | "sos-depannage";
  urgent?: boolean;
}> = [
  { slug: "toiture", label: "Toiture", universe: "travaux" },
  { slug: "plomberie", label: "Plomberie", universe: "travaux" },
  { slug: "electricite", label: "Électricité", universe: "travaux" },
  { slug: "chauffage", label: "Chauffage", universe: "travaux" },
  { slug: "peinture", label: "Peinture", universe: "travaux" },
  { slug: "menuiserie", label: "Menuiserie", universe: "travaux" },
  { slug: "maconnerie", label: "Maçonnerie", universe: "travaux" },
  { slug: "carrelage", label: "Carrelage", universe: "travaux" },
  {
    slug: "sos-depannage",
    label: "SOS Dépannage",
    universe: "sos-depannage",
    urgent: true,
  },
];

export function LeadFormHero({
  monthlyLeads,
}: {
  monthlyLeads: number;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<MetierSlug | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      setError("Sélectionnez une catégorie pour continuer.");
      return;
    }
    const cat = HERO_CATEGORIES.find((c) => c.slug === selected)!;
    const params = new URLSearchParams(
      cat.universe === "sos-depannage"
        ? { universe: cat.universe }
        : { universe: cat.universe, category: cat.slug },
    );
    router.push(`/demande?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-2xl sm:p-8"
      noValidate
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold leading-tight text-foreground">
            Décrivez votre besoin en 2 minutes
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gratuit, rapide et sans engagement
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
          {monthlyLeads} demandes ce mois
        </span>
      </div>

      <div className="mt-6">
        <HeroStepper currentStep={1} />
      </div>

      <h3 className="mt-6 text-sm font-semibold text-foreground">
        Quel type de service recherchez-vous ?
      </h3>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {HERO_CATEGORIES.map((cat) => {
          const Icon = getMetierIcon(cat.slug);
          const isSelected = selected === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => {
                setSelected(cat.slug);
                setError(null);
              }}
              className={cn(
                "group flex flex-col items-center justify-center gap-1.5 rounded-md border bg-card px-2 py-3 text-xs font-medium transition-all",
                isSelected
                  ? cat.urgent
                    ? "border-destructive bg-destructive/5 text-destructive"
                    : "border-accent bg-accent/5 text-accent-foreground"
                  : "border-border text-foreground hover:border-accent/40 hover:bg-muted",
                cat.urgent && !isSelected && "border-destructive/30 bg-destructive/[0.02]",
              )}
              aria-pressed={isSelected}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  cat.urgent ? "text-destructive" : "text-primary",
                )}
                aria-hidden
              />
              <span className="text-center leading-tight text-foreground">
                {cat.label}
              </span>
              {cat.urgent && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-destructive">
                  24/7
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="mt-5 h-12 w-full bg-accent text-base font-semibold text-accent-foreground hover:bg-accent/90"
      >
        Continuer
        <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
      </Button>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {[
          "Sans inscription",
          "Gratuit",
          "Réponse rapide",
        ].map((t) => (
          <span key={t} className="inline-flex items-center gap-1">
            <Check className="h-3 w-3 text-primary" aria-hidden />
            {t}
          </span>
        ))}
      </div>
    </form>
  );
}
