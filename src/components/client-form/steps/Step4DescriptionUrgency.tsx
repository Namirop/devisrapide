"use client";

import type { Control } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { LeadWizardValues } from "@/schemas/lead";

type Props = {
  control: Control<LeadWizardValues>;
};

const URGENCY_OPTIONS = [
  { value: "URGENT", label: "Urgent", hint: "Sous 24-48h" },
  { value: "SOON", label: "Bientôt", hint: "Dans la semaine" },
  { value: "PLANNED", label: "Planifié", hint: "Dans le mois" },
  { value: "FLEXIBLE", label: "Flexible", hint: "Pas de date fixe" },
] as const;

export function Step4DescriptionUrgency({ control }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Décrivez votre besoin</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Ex : remplacement d'un chauffe-eau de 200L, ancien modèle hors service…"
                rows={6}
                maxLength={2000}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="urgency"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Quand souhaitez-vous l&apos;intervention&nbsp;?</FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="grid grid-cols-2 gap-2"
              >
                {URGENCY_OPTIONS.map((opt) => {
                  const checked = field.value === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/60",
                        checked && "border-primary ring-2 ring-primary/30",
                      )}
                    >
                      <RadioGroupItem value={opt.value} className="mt-1" />
                      <span className="flex flex-col">
                        <span className="text-sm font-medium">
                          {opt.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {opt.hint}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
