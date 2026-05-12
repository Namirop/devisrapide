"use client";

import type { Control } from "react-hook-form";
import { AlertTriangle, CalendarDays, Calendar, Clock } from "lucide-react";

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
  { value: "URGENT", label: "Urgent", hint: "Sous 24-48h", Icon: AlertTriangle },
  { value: "SOON", label: "Bientôt", hint: "Dans la semaine", Icon: Clock },
  { value: "PLANNED", label: "Planifié", hint: "Dans le mois", Icon: CalendarDays },
  { value: "FLEXIBLE", label: "Flexible", hint: "Pas de date fixe", Icon: Calendar },
] as const;

export function Step4DescriptionUrgency({ control }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[15.5px] font-semibold text-slate-900">
              Décrivez votre besoin
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="Ex : remplacement d'un chauffe-eau de 200L, ancien modèle hors service…"
                rows={6}
                maxLength={2000}
                className="resize-y border-slate-200 bg-white text-[15px] focus-visible:border-[#1e3a8a] focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/20"
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
            <FormLabel className="text-[15.5px] font-semibold text-slate-900">
              Quand souhaitez-vous l&apos;intervention&nbsp;?
            </FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="grid grid-cols-2 gap-2"
              >
                {URGENCY_OPTIONS.map((opt) => {
                  const checked = field.value === opt.value;
                  const isUrgent = opt.value === "URGENT";
                  return (
                    <label
                      key={opt.value}
                      className={cn(
                        "group flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-4 transition-all duration-200",
                        checked
                          ? isUrgent
                            ? "border-[#ea580c] bg-orange-50/50 ring-2 ring-[#ea580c]/30"
                            : "border-[#1e3a8a] bg-blue-50/40 ring-2 ring-[#1e3a8a]/30"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      <RadioGroupItem value={opt.value} className="mt-0.5" />
                      <div className="flex flex-1 items-start gap-2.5">
                        <opt.Icon
                          className={cn(
                            "mt-0.5 h-5 w-5 shrink-0",
                            checked && isUrgent
                              ? "text-[#ea580c]"
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
                              "text-[15px] font-semibold",
                              checked && isUrgent
                                ? "text-[#ea580c]"
                                : checked
                                  ? "text-[#1e3a8a]"
                                  : "text-slate-900",
                            )}
                          >
                            {opt.label}
                          </span>
                          <span className="text-[13px] text-slate-500">
                            {opt.hint}
                          </span>
                        </span>
                      </div>
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
