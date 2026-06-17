"use client";

import type { Control } from "react-hook-form";
import type { Icon } from "@phosphor-icons/react";
import { Calendar, CalendarBlank, Clock, Lightning, MapPin } from "@phosphor-icons/react";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { LeadWizardValues } from "@/schemas/lead";

type Props = {
  control: Control<LeadWizardValues>;
  // Plafond saisissable (2000 − préfixe sous-besoins injecté au submit).
  descriptionMaxLength?: number;
};

type UrgencyOption = {
  value: "URGENT" | "SOON" | "PLANNED" | "FLEXIBLE";
  label: string;
  hint: string;
  Icon: Icon;
};

const URGENCY_OPTIONS: ReadonlyArray<UrgencyOption> = [
  { value: "URGENT", label: "Urgent", hint: "24 à 48h", Icon: Lightning },
  { value: "SOON", label: "Dans la semaine", hint: "Sous 7 jours", Icon: Clock },
  { value: "PLANNED", label: "Dans le mois", hint: "À planifier", Icon: Calendar },
  {
    value: "FLEXIBLE",
    label: "Flexible",
    hint: "Pas de date fixe",
    Icon: CalendarBlank,
  },
];

const FIELD_INPUT_CLS =
  "h-[52px] border-slate-200 bg-white text-[16px] focus-visible:border-[#1e3a8a] focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/20";

export function Step2Info({ control, descriptionMaxLength = 2000 }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* ── Zone haute : description (gauche) + urgence (droite) ── */}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[15px] font-semibold text-slate-900">
                Décrivez votre besoin en quelques lignes{" "}
                <span className="text-rose-500" aria-hidden>
                  *
                </span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Décrivez votre projet le plus précisément possible (surface, problème rencontré, contraintes d'accès, etc.)"
                  rows={7}
                  maxLength={descriptionMaxLength}
                  className="resize-y border-slate-200 bg-white text-[16px] focus-visible:border-[#1e3a8a] focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/20"
                  {...field}
                />
              </FormControl>
              <div className="flex items-center justify-between gap-2">
                <FormMessage />
                <span className="ml-auto shrink-0 text-[12px] tabular-nums text-slate-400">
                  {field.value?.length ?? 0}/{descriptionMaxLength}
                </span>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="urgency"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[15px] font-semibold text-slate-900">
                Quand souhaitez-vous l&apos;intervention&nbsp;?{" "}
                <span className="text-rose-500" aria-hidden>
                  *
                </span>
              </FormLabel>
              <FormControl>
                <div
                  role="radiogroup"
                  aria-label="Délai souhaité"
                  className="grid grid-cols-2 gap-3 lg:grid-cols-4"
                >
                  {URGENCY_OPTIONS.map((opt) => {
                    const checked = field.value === opt.value;
                    const isUrgent = opt.value === "URGENT";
                    const accent = isUrgent ? "#ea580c" : "#1e3a8a";
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        onClick={() => field.onChange(opt.value)}
                        className={cn(
                          "flex h-full flex-col items-center gap-1.5 rounded-xl border px-3 py-5 text-center transition-all duration-200",
                          checked
                            ? isUrgent
                              ? "border-[#ea580c] bg-[#ea580c]/[0.05]"
                              : "border-[#1e3a8a] bg-[#1e3a8a]/[0.04]"
                            : "border-slate-200 bg-white hover:border-slate-300",
                        )}
                      >
                        <opt.Icon
                          size={26}
                          weight="regular"
                          style={{ color: accent }}
                          aria-hidden
                        />
                        <span
                          className={cn(
                            "mt-1 text-[14px] font-semibold leading-tight",
                            checked
                              ? isUrgent
                                ? "text-[#ea580c]"
                                : "text-[#1e3a8a]"
                              : "text-slate-900",
                          )}
                        >
                          {opt.label}
                        </span>
                        <span className="text-[12px] leading-tight text-slate-500">
                          {opt.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* ── Zone basse : code postal + adresse ── */}
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          control={control}
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[15px] font-semibold text-slate-900">
                Code postal
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <MapPin
                    size={18}
                    weight="regular"
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <Input
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="1000"
                    maxLength={5}
                    className={cn(FIELD_INPUT_CLS, "pl-10")}
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription className="text-[13.5px] text-slate-500">
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
              <FormLabel className="text-[15px] font-semibold text-slate-900">
                Adresse{" "}
                <span className="font-normal text-slate-400">(facultatif)</span>
              </FormLabel>
              <FormControl>
                <Input
                  autoComplete="street-address"
                  placeholder="12 rue de la Loi"
                  className={cn(FIELD_INPUT_CLS, "px-4")}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription className="text-[13.5px] text-slate-500">
                Visible uniquement par le pro qui accepte votre demande.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
