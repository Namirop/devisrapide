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
import type { CatalogueSubCategory } from "@/types/catalogue";

type Props = {
  control: Control<LeadWizardValues>;
  subCategories: CatalogueSubCategory[];
  onPick: (id: string) => void;
};

export function Step3SubCategory({ control, subCategories, onPick }: Props) {
  return (
    <FormField
      control={control}
      name="subCategoryId"
      render={({ field }) => (
        <FormItem>
          <div role="radiogroup" className="flex flex-col gap-2">
            {subCategories.map((s) => {
              const checked = field.value === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => onPick(s.id)}
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
                      {s.name}
                    </span>
                    {s.description && (
                      <span className="text-[13px] leading-relaxed text-slate-500">
                        {s.description}
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
