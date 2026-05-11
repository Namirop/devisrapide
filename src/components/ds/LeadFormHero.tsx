"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getMetierIcon, type MetierSlug } from "./MetierIcon";

// Catalogue hardcodé pour le POC. Sera remplacé par les données Prisma
// après refonte de la seed (Phase 4).
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

const BE_POSTAL = /^[1-9]\d{3}$/;

export function LeadFormHero() {
  const router = useRouter();
  const [selected, setSelected] = useState<MetierSlug | null>(null);
  const [postalCode, setPostalCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      setError("Sélectionnez une catégorie pour continuer.");
      return;
    }
    if (!BE_POSTAL.test(postalCode)) {
      setError("Code postal belge invalide (4 chiffres, 1000-9999).");
      return;
    }
    const cat = HERO_CATEGORIES.find((c) => c.slug === selected)!;
    const params = new URLSearchParams({
      universe: cat.universe,
      category: cat.slug,
      postalCode,
    });
    router.push(`/demande?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card p-6 shadow-lg"
      noValidate
    >
      <h2 className="text-lg font-semibold text-foreground">
        Quel est votre besoin ?
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Sélectionnez une catégorie puis votre code postal.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
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
                    : "border-primary bg-primary/5 text-primary"
                  : "border-border text-foreground hover:border-primary/40 hover:bg-muted",
                cat.urgent && !isSelected && "border-destructive/30",
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
              <span className="text-center leading-tight">{cat.label}</span>
              {cat.urgent && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-destructive">
                  24/7
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <label
          htmlFor="hero-postal"
          className="text-sm font-medium text-foreground"
        >
          Code postal
        </label>
        <Input
          id="hero-postal"
          inputMode="numeric"
          maxLength={4}
          placeholder="1000"
          value={postalCode}
          onChange={(e) => {
            setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 4));
            setError(null);
          }}
          className="mt-1.5"
        />
      </div>

      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="mt-4 h-12 w-full bg-accent text-base font-semibold text-accent-foreground hover:bg-accent/90"
      >
        Continuer
        <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
      </Button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Gratuit · Sans engagement · Réponse sous 4h en moyenne
      </p>
    </form>
  );
}
