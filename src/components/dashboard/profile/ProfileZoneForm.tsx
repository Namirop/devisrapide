"use client";

import { useState } from "react";
import { CircleNotch } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSafeTransition } from "@/hooks/use-safe-transition";
import { cn } from "@/lib/utils";
import { updateInterventionZone } from "@/server/actions/pro-profile-actions";

type Props = {
  initial: {
    postalCode: string;
    city: string;
    radiusKm: number;
  };
};

const RADIUS_OPTIONS = [
  { value: 30, label: "30 km", sub: "autour de votre entreprise" },
  { value: 60, label: "60 km", sub: "autour de votre entreprise" },
  { value: -1, label: "Toute la Belgique", sub: "Aucun filtre distance" },
] as const;

export function ProfileZoneForm({ initial }: Props) {
  const [postalCode, setPostalCode] = useState(initial.postalCode);
  const [radiusKm, setRadiusKm] = useState<number>(initial.radiusKm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useSafeTransition();

  const dirty =
    postalCode !== initial.postalCode || radiusKm !== initial.radiusKm;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await updateInterventionZone({ postalCode, radiusKm });
      if (!result.ok) {
        if (result.fieldErrors) {
          const flat: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(result.fieldErrors)) {
            if (msgs?.[0]) flat[key] = msgs[0];
          }
          setErrors(flat);
        }
        toast.error(result.error);
        return;
      }
      toast.success("Zone d'intervention mise à jour.");
    });
  }

  const radiusLabel =
    radiusKm === -1 ? "toute la Belgique francophone" : `${radiusKm} km`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="postalCode" className="text-[13px] font-medium text-slate-700">
            Code postal de référence
          </Label>
          <Input
            id="postalCode"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="1000"
            maxLength={4}
            inputMode="numeric"
            className={errors.postalCode ? "border-rose-300" : undefined}
          />
          {errors.postalCode ? (
            <p className="text-[12px] text-rose-600">{errors.postalCode}</p>
          ) : (
            <p className="text-[12px] text-slate-500">
              Commune actuelle : {initial.city}
            </p>
          )}
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-slate-700">
          Rayon d&apos;intervention
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {RADIUS_OPTIONS.map((opt) => {
            const active = opt.value === radiusKm;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRadiusKm(opt.value)}
                className={cn(
                  "rounded-md border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-[#1e3a8a] bg-blue-50"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                <div
                  className={cn(
                    "text-[13.5px] font-semibold",
                    active ? "text-[#1e3a8a]" : "text-slate-900",
                  )}
                >
                  {opt.label}
                </div>
                <div className="mt-0.5 text-[11.5px] text-slate-500">
                  {opt.sub}
                </div>
              </button>
            );
          })}
        </div>
      </fieldset>

      <p className="text-[12.5px] text-slate-500">
        Vous recevrez des leads dans un rayon de <strong>{radiusLabel}</strong>{" "}
        autour de {initial.city}.
      </p>

      <div>
        <Button
          type="submit"
          variant="accent"
          disabled={!dirty || isPending}
          className="h-10 px-5"
        >
          {isPending && <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden />}
          Enregistrer la zone
        </Button>
      </div>
    </form>
  );
}
