"use client";

import type { Control } from "react-hook-form";
import { Check } from "lucide-react";

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
              const isSos = u.slug === "sos-depannage";
              return (
                <button
                  key={u.id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => onPick(u.id)}
                  className={cn(
                    "group relative flex h-full flex-col items-start gap-2 rounded-lg border bg-white p-6 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/30",
                    checked
                      ? isSos
                        ? "border-[#ea580c] bg-orange-50/50 ring-2 ring-[#ea580c]/30"
                        : "border-[#1e3a8a] bg-blue-50/40 ring-2 ring-[#1e3a8a]/30"
                      : "border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm",
                  )}
                >
                  {checked && (
                    <span
                      className={cn(
                        "absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full text-white",
                        isSos ? "bg-[#ea580c]" : "bg-[#1e3a8a]",
                      )}
                      aria-hidden
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-[18px] font-semibold",
                      checked && isSos
                        ? "text-[#ea580c]"
                        : checked
                          ? "text-[#1e3a8a]"
                          : "text-slate-900",
                    )}
                  >
                    {u.name}
                  </span>
                  {u.description && (
                    <span className="text-[14px] leading-relaxed text-slate-500">
                      {u.description}
                    </span>
                  )}
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
