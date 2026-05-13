"use client";

import type { Control } from "react-hook-form";
import { Envelope, Phone, User } from "@phosphor-icons/react";

import {
  FormControl,
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

const INPUT_CLS =
  "h-[52px] border-slate-200 bg-white pl-10 text-[16px] focus-visible:border-[#1e3a8a] focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/20";
const ICON_CLS =
  "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400";
const ICON_SIZE = 18;

export function Step6Contact({ control }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[17px] font-semibold text-slate-900">
                Prénom
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <User
                    size={ICON_SIZE}
                    weight="regular"
                    className={ICON_CLS}
                    aria-hidden
                  />
                  <Input
                    autoComplete="given-name"
                    className={INPUT_CLS}
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[17px] font-semibold text-slate-900">
                Nom
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <User
                    size={ICON_SIZE}
                    weight="regular"
                    className={ICON_CLS}
                    aria-hidden
                  />
                  <Input
                    autoComplete="family-name"
                    className={INPUT_CLS}
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[17px] font-semibold text-slate-900">
              Email
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Envelope
                  size={ICON_SIZE}
                  weight="regular"
                  className={ICON_CLS}
                  aria-hidden
                />
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="vous@exemple.be"
                  className={INPUT_CLS}
                  {...field}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[17px] font-semibold text-slate-900">
              Téléphone
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Phone
                  size={ICON_SIZE}
                  weight="regular"
                  className={ICON_CLS}
                  aria-hidden
                />
                <Input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0470 12 34 56"
                  className={INPUT_CLS}
                  {...field}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
