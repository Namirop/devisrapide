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

import {
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
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
                    "group relative flex h-full items-start gap-4 overflow-hidden rounded-md border bg-white p-6 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2",
                    checked
                      ? isSos
                        ? "border-2 border-[#ea580c] bg-orange-50/40 focus-visible:ring-[#ea580c]/30"
                        : "border-2 border-[#1e3a8a] focus-visible:ring-[#1e3a8a]/30"
                      : isSos
                        ? "border-orange-200 bg-orange-50/40 hover:border-orange-300 focus-visible:ring-[#ea580c]/30"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-sm focus-visible:ring-[#1e3a8a]/30",
                  )}
                >
                  {checked && (
                    <span
                      className="pointer-events-none absolute inset-y-0 left-0 w-[3px]"
                      style={{ backgroundColor: accentColor }}
                      aria-hidden
                    />
                  )}
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-md"
                    style={{
                      backgroundColor: isSos ? "#fed7aa40" : "#dbeafe40",
                      color: accentColor,
                    }}
                    aria-hidden
                  >
                    <Icon className="h-[24px] w-[24px]" strokeWidth={2} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span
                      className={cn(
                        "text-[19px] font-semibold",
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
                      <span className="text-[14px] leading-snug text-slate-500">
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
