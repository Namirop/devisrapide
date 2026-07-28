"use client";

import type { Icon } from "@phosphor-icons/react";
import {
  Bathtub,
  Broom,
  CaretDown,
  CheckCircle,
  DotsThree,
  Door,
  Drop,
  ForkKnife,
  Hammer,
  House,
  Key,
  Lightbulb,
  Lightning,
  Lock,
  PaintRoller,
  Plant,
  Plus,
  Ruler,
  ShieldCheck,
  Snowflake,
  Stack,
  Sun,
  Thermometer,
  Tree,
  Truck,
  Trash,
  Waves,
  Wrench,
} from "@phosphor-icons/react";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CatalogueCategory, CatalogueUniverse } from "@/types/catalogue";

type Props = {
  universes: CatalogueUniverse[];
  activeUniverseId: string;
  activeCategoryId: string;
  selectedSubNeedIds: string[];
  onSelectUniverse: (universeId: string) => void;
  onToggleSubNeed: (
    universeId: string,
    categoryId: string,
    subCat: { id: string; name: string; sharedLeadPriceCents: number },
  ) => void;
  onResetSelection: () => void;
  onSelectNotListed: () => void;
};

const SOS_UNIVERSE_SLUG = "depannage-urgences";
const CHECKBOX_CLS =
  "h-[18px] w-[18px] shrink-0 accent-[#1e3a8a] disabled:cursor-not-allowed";

// Icône par catégorie (slug → Phosphor). Couleur navy DA, pas le multi-couleur
// de la maquette. Fallback Wrench.
const CATEGORY_ICONS: Record<string, Icon> = {
  toiture: House,
  facade: PaintRoller,
  maconnerie: Wrench,
  electricite: Lightning,
  energie: Sun,
  securite: ShieldCheck,
  plomberie: Drop,
  chauffage: Thermometer,
  climatisation: Snowflake,
  chassis: Door,
  fermetures: Lock,
  "structures-exterieures": House,
  cuisine: ForkKnife,
  "salle-de-bain": Bathtub,
  "renovation-globale": Hammer,
  "isolation-cloisons": Stack,
  "sols-murs": Stack,
  "menuiserie-interieure": Ruler,
  "amenagement-exterieur": Tree,
  jardin: Plant,
  "piscine-bien-etre": Waves,
  "serrurerie-securite": Key,
  "plomberie-chauffage-urgents": Drop,
  "electricite-24-7": Lightning,
  demenagement: Truck,
  debarras: Trash,
  nettoyage: Broom,
  autre: DotsThree,
};

// Colonnes de la grille de catégories. Le panneau « Bon à savoir » est
// désormais hors grille (aside à droite), donc on compte les catégories seules.
function categoryColsClass(count: number): string {
  switch (count) {
    case 1:
      return "grid-cols-1";
    case 2:
      return "grid-cols-2";
    case 3:
      return "grid-cols-3";
    default:
      // 4 catégories : 2×2 en lg (évite des colonnes trop étroites), 4 en xl.
      return "grid-cols-2 xl:grid-cols-4";
  }
}

export function Step1Project({
  universes,
  activeUniverseId,
  activeCategoryId,
  selectedSubNeedIds,
  onSelectUniverse,
  onToggleSubNeed,
  onResetSelection,
  onSelectNotListed,
}: Props) {
  const selectedUniverse = universes.find((u) => u.id === activeUniverseId);
  const hasSelection = selectedSubNeedIds.length > 0;
  const activeCategoryName =
    selectedUniverse?.categories.find((c) => c.id === activeCategoryId)?.name ??
    "";

  const [openCategoryId, setOpenCategoryId] = useState<string | null>(
    activeCategoryId || null,
  );
  const [pendingCategory, setPendingCategory] =
    useState<CatalogueCategory | null>(null);

  function handleMobileToggle(category: CatalogueCategory) {
    if (openCategoryId === category.id) {
      setOpenCategoryId(null);
      return;
    }
    if (hasSelection && activeCategoryId !== category.id) {
      setPendingCategory(category);
      return;
    }
    setOpenCategoryId(category.id);
  }

  function confirmCategorySwitch() {
    if (!pendingCategory) return;
    onResetSelection();
    setOpenCategoryId(pendingCategory.id);
    setPendingCategory(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Domaine (univers) — chips ── */}
      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Domaine
        </p>
        <div
          className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0"
          role="radiogroup"
          aria-label="Domaine"
        >
          {universes.map((u) => {
            const active = u.id === activeUniverseId;
            const isSos = u.slug === SOS_UNIVERSE_SLUG;
            return (
              <button
                key={u.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onSelectUniverse(u.id)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13.5px] font-medium transition-colors",
                  active
                    ? isSos
                      ? "border-[#ea580c] bg-[#ea580c] text-white"
                      : "border-[#1e3a8a] bg-[#1e3a8a] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                {u.name}
              </button>
            );
          })}
        </div>
      </div>

      {!selectedUniverse ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-[14px] text-slate-500">
          Choisissez un domaine ci-dessus pour voir vos besoins.
        </p>
      ) : (
        <>
          {/* ── DESKTOP : catégories (gauche) + « Bon à savoir » en aside ── */}
          <div className="hidden gap-5 lg:flex">
            <div
              className={cn(
                "grid flex-1 gap-4",
                categoryColsClass(selectedUniverse.categories.length),
              )}
            >
              {selectedUniverse.categories.map((cat) => {
                const isActiveCat = hasSelection && activeCategoryId === cat.id;
                const isLocked = hasSelection && activeCategoryId !== cat.id;
                const CatIcon = CATEGORY_ICONS[cat.slug] ?? Wrench;
                return (
                  <div
                    key={cat.id}
                    title={
                      isLocked
                        ? `Décochez vos besoins dans « ${activeCategoryName} » pour cocher ici`
                        : undefined
                    }
                    className={cn(
                      "flex flex-col rounded-xl border p-4 transition-all duration-200",
                      isActiveCat
                        ? "border-[#1e3a8a] bg-[#1e3a8a]/[0.03]"
                        : "border-slate-200 bg-white",
                      isLocked && "opacity-50",
                    )}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <CatIcon
                        size={20}
                        weight="regular"
                        className={isActiveCat ? "text-[#1e3a8a]" : "text-slate-400"}
                        aria-hidden
                      />
                      <h3
                        className={cn(
                          "text-[13px] font-bold uppercase tracking-wide",
                          isActiveCat ? "text-[#1e3a8a]" : "text-slate-800",
                        )}
                      >
                        {cat.name}
                      </h3>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {cat.subCategories.map((sub) => (
                        <label
                          key={sub.id}
                          className={cn(
                            "flex items-start gap-2.5 text-[14px] leading-snug",
                            isLocked
                              ? "cursor-not-allowed text-slate-400"
                              : "cursor-pointer text-slate-700",
                          )}
                        >
                          <input
                            type="checkbox"
                            className={CHECKBOX_CLS}
                            disabled={isLocked}
                            checked={selectedSubNeedIds.includes(sub.id)}
                            onChange={() =>
                              onToggleSubNeed(selectedUniverse.id, cat.id, {
                                id: sub.id,
                                name: sub.name,
                                sharedLeadPriceCents: sub.sharedLeadPriceCents,
                              })
                            }
                          />
                          <span className="pt-px">{sub.name}</span>
                        </label>
                      ))}
                    </div>
                    <p className="mt-auto pt-3 text-[11.5px] text-slate-400">
                      Plusieurs choix possibles
                    </p>
                  </div>
                );
              })}
            </div>

            {/* « Bon à savoir » — note latérale (sans bordure : ce n'est pas
                une card catégorie, juste un repère à côté de la sélection) */}
            <aside className="flex w-[230px] shrink-0 flex-col rounded-xl bg-slate-50 p-5 xl:w-[250px]">
              <Lightbulb
                size={22}
                weight="fill"
                className="mb-2 text-[#ea580c]"
                aria-hidden
              />
              <h3 className="text-[14px] font-bold text-slate-900">
                Bon à savoir
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-600">
                Plus vous êtes précis, plus les professionnels pourront vous
                faire des offres adaptées à votre projet.
              </p>
              <p className="mt-auto flex items-center gap-1.5 pt-4 text-[12px] font-medium text-emerald-700">
                <CheckCircle size={15} weight="fill" aria-hidden />
                100% gratuit et sans engagement
              </p>
            </aside>
          </div>

          {/* ── MOBILE : accordéon séquentiel ── */}
          <div className="lg:hidden">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              {selectedUniverse.categories.map((cat, idx) => {
                const open = openCategoryId === cat.id;
                const count =
                  activeCategoryId === cat.id ? selectedSubNeedIds.length : 0;
                const CatIcon = CATEGORY_ICONS[cat.slug] ?? Wrench;
                return (
                  <div
                    key={cat.id}
                    className={cn(idx > 0 && "border-t border-slate-200")}
                  >
                    <button
                      type="button"
                      onClick={() => handleMobileToggle(cat)}
                      aria-expanded={open}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                    >
                      <CatIcon
                        size={20}
                        weight="regular"
                        className={count > 0 ? "text-[#1e3a8a]" : "text-slate-400"}
                        aria-hidden
                      />
                      <span
                        className={cn(
                          "flex-1 text-[15px] font-semibold",
                          count > 0 ? "text-[#1e3a8a]" : "text-slate-800",
                        )}
                      >
                        {cat.name}
                        {count > 0 && (
                          <span className="ml-1.5 text-[13px] font-medium text-[#1e3a8a]">
                            ({count})
                          </span>
                        )}
                      </span>
                      <CaretDown
                        size={16}
                        weight="bold"
                        className={cn(
                          "shrink-0 text-slate-400 transition-transform duration-200",
                          open && "rotate-180",
                        )}
                        aria-hidden
                      />
                    </button>
                    {open && (
                      <div className="flex flex-col gap-3 px-4 pb-4">
                        {cat.subCategories.map((sub) => (
                          <label
                            key={sub.id}
                            className="flex items-start gap-2.5 text-[14.5px] leading-snug text-slate-700"
                          >
                            <input
                              type="checkbox"
                              className={CHECKBOX_CLS}
                              checked={selectedSubNeedIds.includes(sub.id)}
                              onChange={() =>
                                onToggleSubNeed(selectedUniverse.id, cat.id, {
                                  id: sub.id,
                                  name: sub.name,
                                  sharedLeadPriceCents: sub.sharedLeadPriceCents,
                                })
                              }
                            />
                            <span className="pt-px">{sub.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[12.5px] font-medium text-emerald-700">
              <CheckCircle size={15} weight="fill" aria-hidden />
              100% gratuit et sans engagement
            </p>
          </div>

          {/* ── "Mon besoin n'est pas dans la liste" — ligne bordée ── */}
          <button
            type="button"
            onClick={onSelectNotListed}
            className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1e3a8a]/10 text-[#1e3a8a]"
              aria-hidden
            >
              <Plus size={16} weight="bold" />
            </span>
            <span className="flex flex-col">
              <span className="text-[14px] font-semibold text-slate-900">
                Mon besoin n&apos;est pas dans la liste
              </span>
              <span className="text-[12.5px] text-slate-500">
                Décrivez votre besoin à l&apos;étape suivante
              </span>
            </span>
          </button>
        </>
      )}

      {/* Confirmation mobile avant de perdre les sélections en cours. */}
      <Dialog
        open={pendingCategory !== null}
        onOpenChange={(o) => {
          if (!o) setPendingCategory(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-[18px] font-bold text-slate-900">
              Changer de catégorie&nbsp;?
            </DialogTitle>
            <DialogDescription className="text-[13.5px] leading-relaxed text-slate-600">
              Vos sélections dans «&nbsp;{activeCategoryName}&nbsp;» seront
              perdues.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingCategory(null)}
            >
              Annuler
            </Button>
            <Button type="button" variant="accent" onClick={confirmCategorySwitch}>
              Continuer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
