"use client";

import type { Control } from "react-hook-form";

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
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3"
          >
            {universes.map((u) => {
              const checked = field.value === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => onPick(u.id)}
                  className={cn(
                    "flex h-full flex-col items-start gap-1 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    checked && "border-primary ring-2 ring-primary/30",
                  )}
                >
                  <span className="text-base font-medium">{u.name}</span>
                  {u.description && (
                    <span className="text-sm text-muted-foreground">
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
