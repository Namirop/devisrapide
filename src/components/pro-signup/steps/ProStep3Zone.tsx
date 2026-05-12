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
import { cn } from "@/lib/utils";
import type { ProSignupWizardValues } from "@/schemas/pro-signup";

const RADIUS_OPTIONS: ReadonlyArray<{
  value: 30 | 60 | -1;
  label: string;
  hint: string;
}> = [
  {
    value: 30,
    label: "30 km",
    hint: "Zone resserrée autour de votre commune",
  },
  {
    value: 60,
    label: "60 km",
    hint: "Couverture régionale élargie",
  },
  {
    value: -1,
    label: "Toute la Belgique francophone",
    hint: "Wallonie + Bruxelles (zone V1)",
  },
];

export function ProStep3Zone({
  control,
}: {
  control: Control<ProSignupWizardValues>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <FormField
        control={control}
        name="zonePostalCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[15.5px] font-semibold text-slate-900">
              Code postal de référence
            </FormLabel>
            <FormControl>
              <div className="relative">
                <MapPin
                  className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  strokeWidth={2}
                  aria-hidden
                />
                <Input
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="1000"
                  className="h-[52px] border-slate-200 bg-white pl-10 text-[16px] focus-visible:border-[#1e3a8a] focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/20"
                  {...field}
                />
              </div>
            </FormControl>
            <FormDescription className="text-[13px] text-slate-500">
              Point d&apos;ancrage de votre zone d&apos;intervention
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="radiusKm"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[15.5px] font-semibold text-slate-900">
              Rayon d&apos;intervention
            </FormLabel>
            <div className="mt-2 grid gap-2">
              {RADIUS_OPTIONS.map((opt) => {
                const checked = field.value === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => field.onChange(opt.value)}
                    aria-pressed={checked}
                    className={cn(
                      "flex items-start gap-3 border bg-white px-5 py-4 text-left transition-all duration-150",
                      checked
                        ? "border-[#1e3a8a] bg-blue-50/40"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2",
                        checked
                          ? "border-[#1e3a8a]"
                          : "border-slate-300",
                      )}
                      aria-hidden
                    >
                      {checked && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1e3a8a]" />
                      )}
                    </span>
                    <div className="flex flex-col">
                      <span
                        className={cn(
                          "text-[15px] font-semibold leading-tight",
                          checked ? "text-[#1e3a8a]" : "text-slate-900",
                        )}
                      >
                        {opt.label}
                      </span>
                      <span className="mt-1 text-[12.5px] text-slate-500">
                        {opt.hint}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
