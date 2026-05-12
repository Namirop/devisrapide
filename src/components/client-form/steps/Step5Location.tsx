"use client";

import type { Control } from "react-hook-form";
import { MapPin } from "lucide-react";

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
    <div className="flex flex-col gap-5">
      <FormField
        control={control}
        name="postalCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[15.5px] font-semibold text-slate-900">
              Code postal
            </FormLabel>
            <FormControl>
              <div className="relative">
                <MapPin
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                  strokeWidth={2}
                  aria-hidden
                />
                <Input
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="1000"
                  maxLength={5}
                  className="h-12 border-slate-200 bg-white pl-10 text-[15px] focus-visible:border-[#1e3a8a] focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/20"
                  {...field}
                />
              </div>
            </FormControl>
            <FormDescription className="text-[13px] text-slate-500">
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
            <FormLabel className="text-[15.5px] font-semibold text-slate-900">
              Adresse{" "}
              <span className="font-normal text-slate-400">(facultatif)</span>
            </FormLabel>
            <FormControl>
              <Input
                autoComplete="street-address"
                placeholder="12 rue de la Loi"
                className="h-12 border-slate-200 bg-white px-4 text-[15px] focus-visible:border-[#1e3a8a] focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/20"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormDescription className="text-[13px] text-slate-500">
              Visible uniquement par le pro qui accepte votre demande.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
