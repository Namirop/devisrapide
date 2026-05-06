"use client";

import type { Control } from "react-hook-form";

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
                    "flex flex-col items-start rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    checked && "border-primary ring-2 ring-primary/30",
                  )}
                >
                  <span className="text-base font-medium">{s.name}</span>
                  {s.description && (
                    <span className="text-sm text-muted-foreground">
                      {s.description}
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
