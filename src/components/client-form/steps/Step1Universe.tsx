"use client";

import type { Control } from "react-hook-form";
import {
  AlertCircle,
  Hammer,
  Lightbulb,
  MoreHorizontal,
  Paintbrush,
  Trees,
  type LucideIcon,
} from "lucide-react";

import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { LeadWizardValues } from "@/schemas/lead";
import type { CatalogueUniverse } from "@/types/catalogue";

type Props = {
  control: Control<LeadWizardValues>;
  universes: CatalogueUniverse[];
  onPick: (id: string) => void;
};

// Mapping slug -> icon. Slugs alignes sur prisma/seed.ts (Universe.slug).
// Si un nouveau universe est ajoute au seed, l'icone par defaut tombe sur
// MoreHorizontal — non bloquant mais a completer.
const UNIVERSE_ICONS: Record<string, LucideIcon> = {
  "gros-oeuvre-toiture": Hammer,
  "techniques-energie": Lightbulb,
  "renovation-interieur": Paintbrush,
  "exterieur-amenagement": Trees,
  "urgence-services": AlertCircle,
  autre: MoreHorizontal,
};

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
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {universes.map((u) => {
              const checked = field.value === u.id;
              const isSos = u.slug === SOS_UNIVERSE_SLUG;
              const Icon = UNIVERSE_ICONS[u.slug] ?? MoreHorizontal;
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
                      "grid shrink-0 place-items-center px-5 transition-colors duration-200",
                      checked
                        ? isSos
                          ? "bg-orange-100/70"
                          : "bg-blue-50"
                        : "",
                    )}
                    style={{ color: accentColor }}
                    aria-hidden
                  >
                    <Icon className="h-9 w-9" strokeWidth={1.75} />
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
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-5 py-5">
                    <span
                      className={cn(
                        "text-[18px] font-semibold leading-tight",
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
                      <span className="text-[13px] leading-snug text-slate-500">
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
