"use client";

import type { Control } from "react-hook-form";

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
                    "flex flex-col items-start rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    checked && "border-primary ring-2 ring-primary/30",
                  )}
                >
                  <span className="text-base font-medium">{c.name}</span>
                  {c.description && (
                    <span className="text-sm text-muted-foreground">
                      {c.description}
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
