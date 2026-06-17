"use client";

import { CircleNotch } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  EXCLUSIVE_SUGGESTION_MULTIPLIER,
  type UpdateCategoryPricingInput,
} from "@/schemas/pricing";
import { updateCategoryPricing } from "@/server/actions/admin-pricing";
import type { PricingCategory } from "@/server/queries/admin-pricing";

const centsToStr = (cents: number | null): string =>
  cents === null ? "" : String(cents / 100);

const parseEur = (v: string): number | null => {
  const t = v.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : NaN;
};

const PRICE_INPUT_CLS =
  "h-9 w-24 rounded-md border border-slate-200 bg-white px-2.5 text-[13.5px] text-slate-900 tabular-nums focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20";

type SubState = { shared: string; exclusive: string };

export function CategoryPricingCard({ category }: { category: PricingCategory }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [catShared, setCatShared] = useState(
    String(category.defaultSharedLeadPriceCents / 100),
  );
  const [catExclusive, setCatExclusive] = useState(
    String(category.defaultExclusiveLeadPriceCents / 100),
  );
  const [subs, setSubs] = useState<Record<string, SubState>>(() =>
    Object.fromEntries(
      category.subCategories.map((s) => [
        s.id,
        {
          shared: centsToStr(s.sharedLeadPriceCents),
          exclusive: centsToStr(s.exclusiveLeadPriceCents),
        },
      ]),
    ),
  );

  function applySuggestion() {
    const shared = parseEur(catShared);
    if (!shared || Number.isNaN(shared)) return;
    setCatExclusive(
      String(Math.round(shared * EXCLUSIVE_SUGGESTION_MULTIPLIER * 100) / 100),
    );
  }

  function handleSave() {
    if (pending) return;

    const sharedEur = parseEur(catShared);
    const exclusiveEur = parseEur(catExclusive);
    if (
      !sharedEur ||
      Number.isNaN(sharedEur) ||
      !exclusiveEur ||
      Number.isNaN(exclusiveEur)
    ) {
      toast.error("Prix catégorie invalides (nombres positifs requis).");
      return;
    }

    const subPayload: UpdateCategoryPricingInput["subCategories"] = [];
    for (const s of category.subCategories) {
      const st = subs[s.id];
      const sh = parseEur(st.shared);
      const ex = parseEur(st.exclusive);
      if (Number.isNaN(sh) || Number.isNaN(ex)) {
        toast.error(`Prix invalide sur « ${s.name} ».`);
        return;
      }
      if ((sh === null) !== (ex === null)) {
        toast.error(
          `« ${s.name} » : renseignez les deux prix ou laissez les deux vides (hérite).`,
        );
        return;
      }
      subPayload.push({ id: s.id, sharedEur: sh, exclusiveEur: ex });
    }

    startTransition(async () => {
      const res = await updateCategoryPricing({
        categoryId: category.id,
        sharedEur,
        exclusiveEur,
        subCategories: subPayload,
      });
      if (!res.success) {
        toast.error("Échec de l'enregistrement", { description: res.message });
        return;
      }
      toast.success(`Prix de « ${category.name} » enregistrés.`);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-[16px] font-bold text-slate-900">
            {category.name}
          </h3>
          <p className="mt-0.5 text-[12px] text-slate-500">
            Prix par défaut de la catégorie (hors modulation d&apos;urgence).
          </p>
        </div>
        <div className="flex items-end gap-4">
          <PriceField
            label="Standard (€)"
            value={catShared}
            onChange={setCatShared}
          />
          <div>
            <PriceField
              label="Exclusif (€)"
              value={catExclusive}
              onChange={setCatExclusive}
            />
            <button
              type="button"
              onClick={applySuggestion}
              className="mt-1 text-[11px] font-medium text-[#1e3a8a] underline-offset-2 hover:underline"
            >
              Suggérer ×{EXCLUSIVE_SUGGESTION_MULTIPLIER}
            </button>
          </div>
        </div>
      </div>

      {category.subCategories.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
            Sous-catégories — laissez vide pour hériter du défaut
          </p>
          <ul className="flex flex-col gap-2.5">
            {category.subCategories.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3"
              >
                <span className="text-[13.5px] text-slate-700">{s.name}</span>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    aria-label={`Prix standard ${s.name}`}
                    placeholder={String(
                      category.defaultSharedLeadPriceCents / 100,
                    )}
                    value={subs[s.id].shared}
                    onChange={(e) =>
                      setSubs((prev) => ({
                        ...prev,
                        [s.id]: { ...prev[s.id], shared: e.target.value },
                      }))
                    }
                    className={PRICE_INPUT_CLS}
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    aria-label={`Prix exclusif ${s.name}`}
                    placeholder={String(
                      category.defaultExclusiveLeadPriceCents / 100,
                    )}
                    value={subs[s.id].exclusive}
                    onChange={(e) =>
                      setSubs((prev) => ({
                        ...prev,
                        [s.id]: { ...prev[s.id], exclusive: e.target.value },
                      }))
                    }
                    className={PRICE_INPUT_CLS}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <Button
          type="button"
          variant="accent"
          onClick={handleSave}
          disabled={pending}
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
    </div>
  );
}

function PriceField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11.5px] font-medium text-slate-500">{label}</span>
      <input
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={PRICE_INPUT_CLS}
      />
    </label>
  );
}
