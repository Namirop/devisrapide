"use client";

import type { Control } from "react-hook-form";
import { CaretRight } from "@phosphor-icons/react";

import {
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { LeadWizardValues } from "@/schemas/lead";
import type { CatalogueCategory } from "@/types/catalogue";

type Props = {
  control: Control<LeadWizardValues>;
  categories: CatalogueCategory[];
  onPick: (id: string) => void;
};

export function Step2Category({ control, categories, onPick }: Props) {
  return (
    <FormField
      control={control}
      name="categoryId"
      render={({ field }) => (
        <FormItem>
          <div role="radiogroup" className="flex flex-col gap-2">
            {categories.map((c) => {
              const checked = field.value === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => onPick(c.id)}
                  className={cn(
                    "group flex items-center justify-between gap-3 border bg-white px-5 py-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/30",
                    checked
                      ? "border-[#1e3a8a]"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <div className="flex flex-col items-start gap-1">
                    <span
                      className={cn(
                        "text-[17px] font-semibold",
                        checked ? "text-[#1e3a8a]" : "text-slate-900",
                      )}
                    >
                      {c.name}
                    </span>
                    {c.description && (
                      <span className="text-[13px] leading-relaxed text-slate-500">
                        {c.description}
                      </span>
                    )}
                  </div>
                  <CaretRight
                    size={18}
                    weight="bold"
                    className={cn(
                      "shrink-0 transition-colors",
                      checked
                        ? "text-[#1e3a8a]"
                        : "text-slate-400 group-hover:text-slate-600",
                    )}
                    aria-hidden
                  />
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
