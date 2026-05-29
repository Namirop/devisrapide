"use client";

import Link from "next/link";
import type { Control } from "react-hook-form";
import Turnstile from "react-turnstile";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { ProSignupWizardValues } from "@/schemas/pro-signup";

type Props = {
  control: Control<ProSignupWizardValues>;
  values: ProSignupWizardValues;
  allCategories: { id: string; name: string }[];
  onTurnstileSuccess: (token: string) => void;
};

// Fallback dev sans key : "mock" -> verifyTurnstileToken accepte cote
// serveur en dev.
const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA";

function radiusLabel(km: number): string {
  if (km === -1) return "Toute la Belgique francophone";
  return `${km} km`;
}

export function ProStep4Confirm({
  control,
  values,
  allCategories,
  onTurnstileSuccess,
}: Props) {
  const categoryNames = allCategories
    .filter((c) => values.categoryIds.includes(c.id))
    .map((c) => c.name)
    .join(", ");

  return (
    <div className="flex flex-col gap-5">
      <RecapBlock title="Entreprise">
        <RecapRow label="Nom commercial" value={values.companyName} />
        <RecapRow label="N° TVA" value={values.vatNumber} />
        <RecapRow label="Email" value={values.email} />
        <RecapRow label="Téléphone" value={values.phone} />
        <RecapRow label="Code postal" value={values.postalCode} />
      </RecapBlock>

      <RecapBlock title="Métiers">
        <p className="text-[14px] text-slate-700">
          {categoryNames || (
            <span className="italic text-slate-400">Aucun métier sélectionné</span>
          )}
        </p>
      </RecapBlock>

      <RecapBlock title="Zone d'intervention">
        <RecapRow label="Code postal" value={values.zonePostalCode} />
        <RecapRow label="Rayon" value={radiusLabel(values.radiusKm)} />
      </RecapBlock>

      <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50/60 p-4">
        <ConsentField
          control={control}
          name="acceptCgu"
          label={
            <>
              J&apos;accepte les{" "}
              <Link
                href="/cgu-pros"
                target="_blank"
                className="font-medium text-[#1e3a8a] underline-offset-2 hover:underline"
              >
                CGU professionnels
              </Link>
            </>
          }
        />
        <ConsentField
          control={control}
          name="acceptPrivacy"
          label={
            <>
              J&apos;accepte la{" "}
              <Link
                href="/confidentialite"
                target="_blank"
                className="font-medium text-[#1e3a8a] underline-offset-2 hover:underline"
              >
                politique de confidentialité
              </Link>
            </>
          }
        />
      </div>

      <FormField
        control={control}
        name="turnstileToken"
        render={({ fieldState, formState }) => (
          <FormItem>
            <Turnstile
              sitekey={TURNSTILE_SITE_KEY}
              onVerify={onTurnstileSuccess}
              theme="light"
            />
            {(fieldState.isTouched || formState.submitCount > 0) && (
              <FormMessage />
            )}
          </FormItem>
        )}
      />
    </div>
  );
}

function RecapBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <div className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[14px]">
      <span className="text-slate-500">{label}</span>
      <span className="truncate text-right font-medium text-slate-900">
        {value || <span className="italic text-slate-400">—</span>}
      </span>
    </div>
  );
}

function ConsentField({
  control,
  name,
  label,
}: {
  control: Control<ProSignupWizardValues>;
  name: "acceptCgu" | "acceptPrivacy";
  label: React.ReactNode;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState, formState }) => (
        <FormItem>
          <FormControl>
            <label className="flex cursor-pointer items-start gap-3 text-[13.5px] text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(field.value)}
                onChange={(e) => field.onChange(e.target.checked)}
                className={cn(
                  "mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20",
                )}
              />
              <span>{label}</span>
            </label>
          </FormControl>
          {/* Le schema Zod combine via .and() fait que le resolver evalue
              acceptCgu/acceptPrivacy meme quand l'utilisateur n'a pas encore
              interagi avec — sinon l'erreur "Vous devez accepter les CGU"
              s'affiche immediatement a l'arrivee sur le step 4. On gate
              l'affichage derriere isTouched OU une tentative de submit
              pour preserver le feedback apres click "Soumettre". */}
          {(fieldState.isTouched || formState.submitCount > 0) && (
            <FormMessage />
          )}
        </FormItem>
      )}
    />
  );
}
