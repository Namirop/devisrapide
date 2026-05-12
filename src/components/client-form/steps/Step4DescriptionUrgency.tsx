"use client";

import type { Control } from "react-hook-form";
import {
  AlertTriangle,
  Calendar,
  CalendarDays,
  Clock,
  type LucideIcon,
} from "lucide-react";

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

type UrgencyOption = {
  value: "URGENT" | "SOON" | "PLANNED" | "FLEXIBLE";
  label: string;
  hint: string;
  Icon: LucideIcon;
};

const URGENCY_OPTIONS: ReadonlyArray<UrgencyOption> = [
  { value: "URGENT", label: "Urgent", hint: "Sous 24-48h", Icon: AlertTriangle },
  { value: "SOON", label: "Bientôt", hint: "Dans la semaine", Icon: Clock },
  { value: "PLANNED", label: "Planifié", hint: "Dans le mois", Icon: CalendarDays },
  { value: "FLEXIBLE", label: "Flexible", hint: "Pas de date fixe", Icon: Calendar },
];

export function Step4DescriptionUrgency({ control }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[17px] font-semibold text-slate-900">
              Décrivez votre besoin
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="Ex : remplacement d'un chauffe-eau de 200L, ancien modèle hors service…"
                rows={6}
                maxLength={2000}
                className="resize-y border-slate-200 bg-white text-[16px] focus-visible:border-[#1e3a8a] focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/20"
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
            <FormLabel className="text-[17px] font-semibold text-slate-900">
              Quand souhaitez-vous l&apos;intervention&nbsp;?
            </FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="grid grid-cols-2 gap-2 lg:grid-cols-4"
              >
                {URGENCY_OPTIONS.map((opt) => {
                  const checked = field.value === opt.value;
                  const isUrgent = opt.value === "URGENT";
                  const accent = isUrgent ? "#ea580c" : "#1e3a8a";
                  return (
                    <label
                      key={opt.value}
                      className={cn(
                        "group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-md border bg-white p-5 transition-all duration-200",
                        checked
                          ? isUrgent
                            ? "border-2 border-[#ea580c]"
                            : "border-2 border-[#1e3a8a]"
                          : isUrgent
                            ? "border-orange-200 hover:border-orange-300"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      {checked && (
                        <span
                          className="pointer-events-none absolute inset-y-0 left-0 w-[3px]"
                          style={{ backgroundColor: accent }}
                          aria-hidden
                        />
                      )}
                      <RadioGroupItem value={opt.value} className="sr-only" />
                      <span className="flex items-center gap-3">
                        <opt.Icon
                          className={cn(
                            "size-7 shrink-0",
                            isUrgent
                              ? "text-orange-600"
                              : checked
                                ? "text-[#1e3a8a]"
                                : "text-slate-500",
                          )}
                          strokeWidth={2}
                          aria-hidden
                        />
                        <span className="flex flex-col">
                          <span
                            className={cn(
                              "text-[17px] font-semibold leading-tight",
                              checked && isUrgent
                                ? "text-[#ea580c]"
                                : checked
                                  ? "text-[#1e3a8a]"
                                  : "text-slate-900",
                            )}
                          >
                            {opt.label}
                          </span>
                          <span className="mt-1 whitespace-nowrap text-[13.5px] text-slate-500">
                            {opt.hint}
                          </span>
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
