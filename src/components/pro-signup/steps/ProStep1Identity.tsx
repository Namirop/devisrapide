"use client";

import type { Control } from "react-hook-form";
import {
  Buildings,
  Envelope,
  Hash,
  Key,
  MapPin,
  Phone,
} from "@phosphor-icons/react";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { ProSignupWizardValues } from "@/schemas/pro-signup";

const LABEL_CLS = "text-[15.5px] font-semibold text-slate-900";
const INPUT_CLS =
  "h-[52px] border-slate-200 bg-white pl-10 text-[16px] focus-visible:border-[#1e3a8a] focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/20";
const ICON_CLS =
  "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400";
const ICON_SIZE = 18;

export function ProStep1Identity({
  control,
}: {
  control: Control<ProSignupWizardValues>;
}) {
  return (
    <div className="flex flex-col gap-5">
      <FormField
        control={control}
        name="companyName"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={LABEL_CLS}>Nom commercial</FormLabel>
            <FormControl>
              <div className="relative">
                <Buildings
                  size={ICON_SIZE}
                  weight="regular"
                  className={ICON_CLS}
                  aria-hidden
                />
                <Input
                  placeholder="Dupont Toitures SRL"
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
        name="vatNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={LABEL_CLS}>Numéro de TVA</FormLabel>
            <FormControl>
              <div className="relative">
                <Hash
                  size={ICON_SIZE}
                  weight="regular"
                  className={ICON_CLS}
                  aria-hidden
                />
                <Input
                  placeholder="BE0123456789"
                  className={INPUT_CLS}
                  {...field}
                />
              </div>
            </FormControl>
            <FormDescription className="text-[13px] text-slate-500">
              Format BE suivi de 10 chiffres
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={LABEL_CLS}>Email pro</FormLabel>
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
                    autoComplete="email"
                    placeholder="contact@dupont-toitures.be"
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
              <FormLabel className={LABEL_CLS}>Téléphone</FormLabel>
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

      <FormField
        control={control}
        name="postalCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={LABEL_CLS}>
              Code postal de l&apos;entreprise
            </FormLabel>
            <FormControl>
              <div className="relative">
                <MapPin
                  size={ICON_SIZE}
                  weight="regular"
                  className={ICON_CLS}
                  aria-hidden
                />
                <Input
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="1000"
                  className={INPUT_CLS}
                  {...field}
                />
              </div>
            </FormControl>
            <FormDescription className="text-[13px] text-slate-500">
              Sera utilisé par défaut comme zone d&apos;intervention
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          control={control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={LABEL_CLS}>Mot de passe</FormLabel>
              <FormControl>
                <div className="relative">
                  <Key
                    size={ICON_SIZE}
                    weight="regular"
                    className={ICON_CLS}
                    aria-hidden
                  />
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="8+ caractères, 1 maj, 1 chiffre"
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
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={LABEL_CLS}>Confirmer</FormLabel>
              <FormControl>
                <div className="relative">
                  <Key
                    size={ICON_SIZE}
                    weight="regular"
                    className={ICON_CLS}
                    aria-hidden
                  />
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Retapez votre mot de passe"
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
    </div>
  );
}
