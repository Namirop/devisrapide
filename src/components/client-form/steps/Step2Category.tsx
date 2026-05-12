"use client";

import type { Control } from "react-hook-form";
import { ChevronRight } from "lucide-react";

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
                    "group flex items-center justify-between gap-3 rounded-lg border bg-white p-5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/30",
                    checked
                      ? "border-[#1e3a8a] bg-blue-50/40 ring-2 ring-[#1e3a8a]/30"
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
                      <span className="text-[13.5px] leading-relaxed text-slate-500">
                        {c.description}
                      </span>
                    )}
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-5 w-5 shrink-0 transition-colors",
                      checked
                        ? "text-[#1e3a8a]"
                        : "text-slate-400 group-hover:text-slate-600",
                    )}
                    strokeWidth={2}
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
