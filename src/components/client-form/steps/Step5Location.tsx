"use client";

import type { Control } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { LeadWizardValues } from "@/schemas/lead";

type Props = {
  control: Control<LeadWizardValues>;
};

export function Step5Location({ control }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <FormField
        control={control}
        name="postalCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Code postal</FormLabel>
            <FormControl>
              <Input
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="59000"
                maxLength={5}
                {...field}
              />
            </FormControl>
            <FormDescription>
              La commune sera détectée automatiquement à l&apos;envoi.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Adresse <span className="text-muted-foreground">(facultatif)</span>
            </FormLabel>
            <FormControl>
              <Input
                autoComplete="street-address"
                placeholder="12 rue de la République"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormDescription>
              Visible uniquement par le pro qui accepte votre demande.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
