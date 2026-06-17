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
  "h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-[13.5px] text-slate-900 tabular-nums focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20";

// Grille partagée par l'en-tête, la ligne catégorie et les sous-catégories →
// les colonnes "Standard" / "Exclusif" sont parfaitement alignées. Dernière
// colonne (étroite) = bouton suggestion ×2.5 sur la ligne catégorie, vide
// ailleurs (ne casse jamais l'alignement vertical).
const PRICE_GRID_CLS =
  "grid grid-cols-[minmax(0,1fr)_5.5rem_5.5rem_2.5rem] items-center gap-x-3";

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

  const inheritedShared = String(category.defaultSharedLeadPriceCents / 100);
  const inheritedExclusive = String(
    category.defaultExclusiveLeadPriceCents / 100,
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {/* En-têtes de colonnes, alignés sur tous les inputs en dessous. */}
      <div className={`${PRICE_GRID_CLS} items-end`}>
        <div className="min-w-0">
          <h3 className="font-display text-[16px] font-bold text-slate-900">
            {category.name}
          </h3>
          <p className="mt-0.5 text-[12px] text-slate-500">
            Prix par défaut (hors modulation d&apos;urgence).
          </p>
        </div>
        <span className="text-[11px] font-medium text-slate-500">
          Standard (€)
        </span>
        <span className="text-[11px] font-medium text-slate-500">
          Exclusif (€)
        </span>
        <div aria-hidden />
      </div>

      {/* Ligne prix catégorie. */}
      <div className={`mt-1.5 ${PRICE_GRID_CLS}`}>
        <div aria-hidden />
        <input
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          aria-label={`Prix standard ${category.name}`}
          value={catShared}
          onChange={(e) => setCatShared(e.target.value)}
          className={PRICE_INPUT_CLS}
        />
        <input
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          aria-label={`Prix exclusif ${category.name}`}
          value={catExclusive}
          onChange={(e) => setCatExclusive(e.target.value)}
          className={PRICE_INPUT_CLS}
        />
        <button
          type="button"
          onClick={applySuggestion}
          title={`Suggérer le prix exclusif (×${EXCLUSIVE_SUGGESTION_MULTIPLIER} du standard)`}
          className="text-left text-[11.5px] font-medium text-[#1e3a8a] underline-offset-2 hover:underline"
        >
          ×{EXCLUSIVE_SUGGESTION_MULTIPLIER}
        </button>
      </div>

      {category.subCategories.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
            Sous-catégories — laissez vide pour hériter du défaut
          </p>
          <ul className="flex flex-col">
            {category.subCategories.map((s) => (
              <li key={s.id} className={`${PRICE_GRID_CLS} py-1.5`}>
                <span className="truncate text-[13.5px] text-slate-700">
                  {s.name}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  aria-label={`Prix standard ${s.name}`}
                  placeholder={inheritedShared}
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
                  placeholder={inheritedExclusive}
                  value={subs[s.id].exclusive}
                  onChange={(e) =>
                    setSubs((prev) => ({
                      ...prev,
                      [s.id]: { ...prev[s.id], exclusive: e.target.value },
                    }))
                  }
                  className={PRICE_INPUT_CLS}
                />
                <div aria-hidden />
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
