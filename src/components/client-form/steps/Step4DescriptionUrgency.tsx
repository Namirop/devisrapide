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
  {
    value: "URGENT",
    label: "Urgent",
    hint: "Sous 24-48h",
    Icon: AlertTriangle,
  },
  { value: "SOON", label: "Bientôt", hint: "Dans la semaine", Icon: Clock },
  {
    value: "PLANNED",
    label: "Planifié",
    hint: "Dans le mois",
    Icon: CalendarDays,
  },
  {
    value: "FLEXIBLE",
    label: "Flexible",
    hint: "Pas de date fixe",
    Icon: Calendar,
  },
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
                        "group relative flex h-full cursor-pointer items-stretch overflow-hidden border bg-white transition-all duration-200",
                        checked
                          ? isUrgent
                            ? "border-[#ea580c]"
                            : "border-[#1e3a8a]"
                          : isUrgent
                            ? "border-orange-200 hover:border-orange-300"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      {/* RadioGroupItem wrappe dans un span absolute pour le sortir
                          du flex flow. Le `sr-only` seul ne suffit pas car base-ui
                          force size-4 + relative via ses classes internes que
                          tailwind-merge ne resout pas. */}
                      <span className="pointer-events-none absolute h-0 w-0 overflow-hidden">
                        <RadioGroupItem value={opt.value} />
                      </span>
                      <div
                        className={cn(
                          "grid shrink-0 place-items-center px-5 transition-colors duration-200",
                          checked
                            ? isUrgent
                              ? "bg-orange-100/70"
                              : "bg-blue-50"
                            : "",
                        )}
                        style={{
                          color: isUrgent ? "#ea580c" : accent,
                        }}
                        aria-hidden
                      >
                        <opt.Icon className="h-7 w-7" strokeWidth={2} />
                      </div>
                      <div
                        className={cn(
                          "w-px",
                          checked
                            ? isUrgent
                              ? "bg-[#ea580c]/30"
                              : "bg-[#1e3a8a]/20"
                            : isUrgent
                              ? "bg-orange-200"
                              : "bg-slate-200",
                        )}
                        aria-hidden
                      />
                      <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-4">
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
                        <span className="whitespace-nowrap text-[13px] text-slate-500">
                          {opt.hint}
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
