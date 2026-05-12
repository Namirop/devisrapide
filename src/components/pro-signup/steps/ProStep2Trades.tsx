"use client";

import type { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";

import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { ProSignupWizardValues } from "@/schemas/pro-signup";
import type {
  Category,
  UniverseWithCategories,
} from "../ProSignupWizard";

type Props = {
  universes: UniverseWithCategories[];
  control: Control<ProSignupWizardValues>;
  setValue: UseFormSetValue<ProSignupWizardValues>;
  watch: UseFormWatch<ProSignupWizardValues>;
};

export function ProStep2Trades({ universes, control, setValue, watch }: Props) {
  const selected = watch("categoryIds");

  function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter((c) => c !== id)
      : [...selected, id];
    setValue("categoryIds", next, { shouldValidate: true });
  }

  return (
    <FormField
      control={control}
      name="categoryIds"
      render={() => (
        <FormItem>
          <div className="flex flex-col gap-6">
            {universes.map((u) => (
              <section key={u.id}>
                <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-slate-500">
                  {u.name}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {u.categories.map((c: Category) => {
                    const checked = selected.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggle(c.id)}
                        aria-pressed={checked}
                        className={cn(
                          "flex items-center gap-3 border bg-white px-4 py-3 text-left transition-all duration-150",
                          checked
                            ? "border-[#1e3a8a] bg-blue-50/40"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-5 w-5 shrink-0 place-items-center rounded border-2",
                            checked
                              ? "border-[#1e3a8a] bg-[#1e3a8a]"
                              : "border-slate-300 bg-white",
                          )}
                          aria-hidden
                        >
                          {checked && (
                            <svg
                              viewBox="0 0 16 16"
                              fill="none"
                              className="h-3 w-3 text-white"
                            >
                              <path
                                d="M3 8.5l3.5 3 6-7"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        <span
                          className={cn(
                            "text-[14.5px] font-medium",
                            checked ? "text-[#1e3a8a]" : "text-slate-900",
                          )}
                        >
                          {c.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 text-[13px] text-slate-500">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-semibold",
                selected.length > 0
                  ? "bg-[#1e3a8a] text-white"
                  : "bg-slate-100 text-slate-600",
              )}
            >
              {selected.length}
            </span>
            <span>
              {selected.length === 0
                ? "Aucun métier sélectionné"
                : selected.length === 1
                  ? "métier sélectionné"
                  : "métiers sélectionnés"}
            </span>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
