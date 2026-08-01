"use client";

import type { Control } from "react-hook-form";
import { CheckCircle } from "@phosphor-icons/react";
import Turnstile from "react-turnstile";

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
  onTurnstileSuccess: (token: string) => void;
};

const INPUT_CLS =
  "h-[52px] border-slate-200 bg-white px-4 text-[16px] focus-visible:border-[#1e3a8a] focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/20";

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA";

function RequiredMark() {
  return (
    <span className="text-rose-500" aria-hidden>
      {" "}
      *
    </span>
  );
}

export function Step3Contact({ control, onTurnstileSuccess }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[15px] font-semibold text-slate-900">
                Prénom
                <RequiredMark />
              </FormLabel>
              <FormControl>
                <Input
                  autoComplete="given-name"
                  placeholder="Votre prénom"
                  className={INPUT_CLS}
                  {...field}
                />
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
              <FormLabel className="text-[15px] font-semibold text-slate-900">
                Nom
                <RequiredMark />
              </FormLabel>
              <FormControl>
                <Input
                  autoComplete="family-name"
                  placeholder="Votre nom"
                  className={INPUT_CLS}
                  {...field}
                />
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
              <FormLabel className="text-[15px] font-semibold text-slate-900">
                Téléphone
                <RequiredMark />
              </FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0470 12 34 56"
                  className={INPUT_CLS}
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-[12.5px] text-slate-500">
                Les professionnels vous contactent par téléphone.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[15px] font-semibold text-slate-900">
                Email
                <RequiredMark />
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="vous@exemple.be"
                  className={INPUT_CLS}
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-[12.5px] text-slate-500">
                Nous vous envoyons un récapitulatif par email.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* ── Réassurance — une seule card scindée en 2 cellules (divider) ── */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60">
        <div className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <Reassurance
            title="Vos données sécurisées"
            text="Nous ne partageons jamais vos informations personnelles."
          />
          <Reassurance
            title="Gratuit et sans engagement"
            text="Recevez jusqu'à 3 devis gratuits, sans obligation."
          />
        </div>
      </div>

      {/* Cloudflare Turnstile anti-bot (invisible en mode normal). */}
      <FormField
        control={control}
        name="turnstileToken"
        render={() => (
          <FormItem>
            <Turnstile
              sitekey={TURNSTILE_SITE_KEY}
              onVerify={onTurnstileSuccess}
              theme="light"
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function Reassurance({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 p-4">
      <CheckCircle
        size={20}
        weight="fill"
        className="mt-px shrink-0 text-emerald-600"
        aria-hidden
      />
      <div>
        <p className="text-[14px] font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-600">
          {text}
        </p>
      </div>
    </div>
  );
}
