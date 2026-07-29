"use client";

import { CircleNotch } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSafeTransition } from "@/hooks/use-safe-transition";
import { updateLeadSettings } from "@/server/actions/admin-config";
import type { LeadSettings } from "@/server/queries/admin-config";

const inputClass =
  "h-9 w-20 rounded-md border border-slate-200 bg-white px-2.5 text-[13.5px] text-slate-900 tabular-nums focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20";

type FieldKey = keyof LeadSettings;

/**
 * Réglages du cycle de vie des leads. Confirmation par mot de passe admin
 * (même protection que le kill switch) : ces valeurs pilotent le rythme de
 * distribution, donc le CA.
 *
 * Les paliers de zone sont présentés en séquence chronologique plutôt qu'en
 * grille de champs : l'ordre des étapes EST l'information, un tableau de 4
 * champs isolés obligerait l'admin à reconstruire mentalement le mécanisme.
 */
export function LeadSettingsForm({ initial }: { initial: LeadSettings }) {
  const router = useRouter();
  const [values, setValues] = useState<LeadSettings>(initial);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useSafeTransition();

  const dirty = (Object.keys(initial) as FieldKey[]).some(
    (k) => values[k] !== initial[k],
  );

  function setField(key: FieldKey, raw: string) {
    setValues((prev) => ({ ...prev, [key]: raw === "" ? 0 : Number(raw) }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!password || pending) return;
    startTransition(async () => {
      const res = await updateLeadSettings({ ...values, password });
      if (!res.success) {
        if (res.fieldErrors) {
          const next: Partial<Record<FieldKey, string>> = {};
          for (const [field, msgs] of Object.entries(res.fieldErrors)) {
            const msg = msgs?.[0];
            if (msg) next[field as FieldKey] = msg;
          }
          setErrors(next);
        }
        toast.error("Enregistrement refusé", { description: res.message });
        // Mot de passe conservé si l'échec vient d'une valeur : l'admin
        // corrige le champ et resoumet sans le retaper.
        if (res.code === "WRONG_PASSWORD") setPassword("");
        else setDialogOpen(false);
        return;
      }
      toast.success("Réglages enregistrés.", {
        description: "Prise en compte sur l'ensemble du site sous 5 minutes.",
      });
      setPassword("");
      setDialogOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-7">
      <Field
        label="Signalé « en souffrance » après"
        hint="Alerte dans ton panel quand un lead n'a toujours pas d'acheteur. N'affecte pas ce que voient les pros."
        unit="heures"
        value={values.souffranceHours}
        error={errors.souffranceHours}
        onChange={(v) => setField("souffranceHours", v)}
      />

      <Field
        label="Expire définitivement après"
        hint="Passé ce délai le lead n'est plus achetable. La durée est figée à la création : ce réglage n'affecte que les demandes à venir."
        unit="heures"
        value={values.globalTimeoutHours}
        error={errors.globalTimeoutHours}
        onChange={(v) => setField("globalTimeoutHours", v)}
      />

      <Field
        label="Acheteurs maximum par lead partagé"
        hint="Nombre de pros pouvant acheter la même demande. Un lead exclusif reste limité à un seul acheteur."
        value={values.maxAcceptances}
        error={errors.maxAcceptances}
        onChange={(v) => setField("maxAcceptances", v)}
      />

      <div className="border-t border-slate-200 pt-6">
        <p className="text-[13.5px] font-semibold text-slate-900">
          Élargissement progressif de la zone
        </p>
        <p className="mt-1 mb-4 text-[12.5px] leading-relaxed text-slate-500">
          Quand personne ne correspond, la plateforme élargit la recherche par
          paliers. Les pros les plus proches sont servis en priorité.
        </p>

        <ol className="flex flex-col gap-3 text-[13.5px] text-slate-700">
          <Step index="1">
            <span>À la création, recherche dans un rayon de</span>
            <NumberInput
              value={values.radiusInitialKm}
              error={errors.radiusInitialKm}
              onChange={(v) => setField("radiusInitialKm", v)}
              aria="Rayon initial en kilomètres"
            />
            <span>km</span>
          </Step>

          <Step index="2">
            <span>Sans acheteur après</span>
            <NumberInput
              value={values.expansionDelay1Min}
              error={errors.expansionDelay1Min}
              onChange={(v) => setField("expansionDelay1Min", v)}
              aria="Délai avant le 1er élargissement, en minutes"
            />
            <span>min, élargir à</span>
            <NumberInput
              value={values.radiusExpandedKm}
              error={errors.radiusExpandedKm}
              onChange={(v) => setField("radiusExpandedKm", v)}
              aria="Rayon élargi en kilomètres"
            />
            <span>km</span>
          </Step>

          <Step index="3">
            <span>Sans acheteur après</span>
            <NumberInput
              value={values.expansionDelay2Min}
              error={errors.expansionDelay2Min}
              onChange={(v) => setField("expansionDelay2Min", v)}
              aria="Délai avant ouverture à toute la Belgique, en minutes"
            />
            <span>min, ouvrir à toute la Belgique</span>
          </Step>
        </ol>

        {(errors.radiusInitialKm ||
          errors.radiusExpandedKm ||
          errors.expansionDelay1Min ||
          errors.expansionDelay2Min) && (
          <p className="mt-3 text-[12.5px] text-rose-700">
            {errors.radiusInitialKm ??
              errors.radiusExpandedKm ??
              errors.expansionDelay1Min ??
              errors.expansionDelay2Min}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
        <p className="text-[12.5px] text-slate-500">
          Les modifications sont prises en compte sur l&apos;ensemble du site
          sous 5 minutes.
        </p>
        <Button
          type="button"
          variant="accent"
          disabled={!dirty}
          onClick={() => setDialogOpen(true)}
          className="shrink-0"
        >
          Enregistrer les réglages
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-[18px] font-bold text-slate-900">
              Enregistrer ces réglages ?
            </DialogTitle>
            <DialogDescription className="text-[13.5px] leading-relaxed text-slate-600">
              Ils modifient le rythme auquel les demandes sont distribuées aux
              professionnels. Hors durée d&apos;expiration, les changements
              s&apos;appliquent aussi aux demandes déjà en circulation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirm} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-medium text-slate-700">
                Confirmez avec votre mot de passe admin
              </span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-[14px] text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              />
            </label>

            <div className="mt-1 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setPassword("");
                }}
                disabled={pending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="accent"
                disabled={!password || pending}
                className="gap-2"
              >
                {pending ? (
                  <>
                    <CircleNotch
                      size={14}
                      weight="bold"
                      className="animate-spin"
                      aria-hidden
                    />
                    Enregistrement…
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  hint,
  unit,
  value,
  error,
  onChange,
}: {
  label: string;
  hint: string;
  unit?: string;
  value: number;
  error?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-500">
          {hint}
        </p>
        {error && <p className="mt-1 text-[12.5px] text-rose-700">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <NumberInput value={value} error={error} onChange={onChange} aria={label} />
        {unit && <span className="text-[13px] text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}

function NumberInput({
  value,
  error,
  onChange,
  aria,
}: {
  value: number;
  error?: string;
  onChange: (v: string) => void;
  aria: string;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={aria}
      aria-invalid={error ? true : undefined}
      value={String(value)}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
      className={
        error ? `${inputClass} border-rose-300 focus:border-rose-400` : inputClass
      }
    />
  );
}

function Step({
  index,
  children,
}: {
  index: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-2">
      <span
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600"
        aria-hidden
      >
        {index}
      </span>
      {children}
    </li>
  );
}
