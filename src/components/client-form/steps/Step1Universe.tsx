"use client";

import type { Control } from "react-hook-form";
import type { Icon } from "@phosphor-icons/react";
import {
  DotsThree,
  Lightning,
  PaintBrushHousehold,
  Question,
  Siren,
  Tree,
  Wall,
} from "@phosphor-icons/react";

import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { LeadWizardValues } from "@/schemas/lead";
import type { CatalogueUniverse } from "@/types/catalogue";

type Props = {
  control: Control<LeadWizardValues>;
  universes: CatalogueUniverse[];
  onPick: (id: string) => void;
};

// Mapping slug -> icon, aligne sur prisma/seed.ts (Universe.slug).
// Si un nouveau universe est ajoute au seed sans entree ici, l'icone par
// defaut tombe sur DotsThree — non bloquant mais a completer.
const UNIVERSE_ICONS: Record<string, Icon> = {
  "gros-oeuvre-toiture": Wall,
  "techniques-energie": Lightning,
  "renovation-interieur": PaintBrushHousehold,
  "exterieur-amenagement": Tree,
  "urgence-services": Siren,
  autre: Question,
};

// Slug de l'univers traite avec le theme orange "urgence" (border, badge,
// bg accents). Anciennement "sos-depannage", renomme avec la refonte
// catalogue 6 univers (cf. prisma/seed.ts).
const SOS_UNIVERSE_SLUG = "urgence-services";

export function Step1Universe({ control, universes, onPick }: Props) {
  return (
    <FormField
      control={control}
      name="universeId"
      render={({ field }) => (
        <FormItem>
          <div
            role="radiogroup"
            className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {universes.map((u) => {
              const checked = field.value === u.id;
              const isSos = u.slug === SOS_UNIVERSE_SLUG;
              const Icon = UNIVERSE_ICONS[u.slug] ?? DotsThree;
              const preview = u.categories
                .slice(0, 3)
                .map((c) => c.name)
                .join(", ");
              const accentColor = isSos ? "#ea580c" : "#1e3a8a";
              return (
                <button
                  key={u.id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => onPick(u.id)}
                  className={cn(
                    "group relative flex h-full items-stretch overflow-hidden border bg-white text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2",
                    checked
                      ? isSos
                        ? "border-[#ea580c] focus-visible:ring-[#ea580c]/30"
                        : "border-[#1e3a8a] focus-visible:ring-[#1e3a8a]/30"
                      : isSos
                        ? "border-orange-200 bg-orange-50/40 hover:border-orange-300 focus-visible:ring-[#ea580c]/30"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-sm focus-visible:ring-[#1e3a8a]/30",
                  )}
                >
                  <div
                    className={cn(
                      "grid shrink-0 place-items-center px-4 transition-colors duration-200",
                      checked
                        ? isSos
                          ? "bg-orange-100/70"
                          : "bg-blue-50"
                        : "",
                    )}
                    style={{ color: accentColor }}
                    aria-hidden
                  >
                    <Icon size={32} weight="regular" />
                  </div>
                  <div
                    className={cn(
                      "w-px",
                      checked
                        ? isSos
                          ? "bg-[#ea580c]/30"
                          : "bg-[#1e3a8a]/20"
                        : "bg-slate-200",
                    )}
                    aria-hidden
                  />
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-4 py-3">
                    <span
                      className={cn(
                        "text-[16px] font-semibold leading-tight",
                        checked && isSos
                          ? "text-[#ea580c]"
                          : checked
                            ? "text-[#1e3a8a]"
                            : "text-slate-900",
                      )}
                    >
                      {u.name}
                    </span>
                    {preview && (
                      <span className="text-[12px] leading-snug text-slate-500">
                        {preview}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
