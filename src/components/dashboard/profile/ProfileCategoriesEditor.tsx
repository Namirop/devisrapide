"use client";

import { useState, useTransition } from "react";
import { Check, CircleNotch, Plus, X } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { updateProCategories } from "@/server/actions/pro-profile-actions";

export type AvailableCategory = {
  id: string;
  name: string;
  universeName: string;
};

type Props = {
  initialSelectedIds: string[];
  availableByUniverse: Array<{
    universe: string;
    categories: AvailableCategory[];
  }>;
};

/**
 * Editeur de metiers couverts. Affiche les pills selectionnees + bouton
 * "Ajouter une categorie" qui ouvre un modal multi-select groupes par
 * univers. Save via updateProCategories Server Action.
 */
export function ProfileCategoriesEditor({
  initialSelectedIds,
  availableByUniverse,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [modalOpen, setModalOpen] = useState(false);
  const [draftIds, setDraftIds] = useState<string[]>(initialSelectedIds);
  const [isPending, startTransition] = useTransition();

  // Aplati pour resolve les noms par id rapidement.
  const flatById = new Map<string, AvailableCategory>();
  for (const grp of availableByUniverse) {
    for (const c of grp.categories) flatById.set(c.id, c);
  }

  function persist(nextIds: string[]) {
    startTransition(async () => {
      const result = await updateProCategories({ categoryIds: nextIds });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSelectedIds(nextIds);
      toast.success("Catégories mises à jour.");
    });
  }

  function removeCategory(id: string) {
    if (selectedIds.length <= 1) {
      toast.error("Vous devez garder au moins une catégorie active.");
      return;
    }
    const next = selectedIds.filter((c) => c !== id);
    persist(next);
  }

  function openModal() {
    setDraftIds(selectedIds);
    setModalOpen(true);
  }

  function toggleDraft(id: string) {
    setDraftIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function saveDraft() {
    if (draftIds.length === 0) {
      toast.error("Sélectionnez au moins une catégorie.");
      return;
    }
    startTransition(async () => {
      const result = await updateProCategories({ categoryIds: draftIds });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSelectedIds(draftIds);
      setModalOpen(false);
      toast.success("Catégories mises à jour.");
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {selectedIds.map((id) => {
          const cat = flatById.get(id);
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-[13px] font-medium text-[#1e3a8a]"
            >
              {cat?.name ?? id}
              <button
                type="button"
                aria-label={`Retirer ${cat?.name ?? id}`}
                onClick={() => removeCategory(id)}
                disabled={isPending}
                className="grid h-4 w-4 place-items-center rounded-full text-[#1e3a8a]/60 hover:bg-[#1e3a8a]/10 hover:text-[#1e3a8a] disabled:opacity-50"
              >
                <X size={12} weight="bold" aria-hidden />
              </button>
            </span>
          );
        })}
        <Button
          type="button"
          variant="outline"
          onClick={openModal}
          disabled={isPending}
          className="h-9 gap-1.5"
        >
          <Plus size={14} weight="regular" aria-hidden />
          Ajouter une catégorie
        </Button>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vos métiers couverts</DialogTitle>
            <DialogDescription>
              Sélectionnez toutes les catégories pour lesquelles vous
              souhaitez recevoir des leads (au moins 1 obligatoire).
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[420px] overflow-y-auto pr-2">
            {availableByUniverse.map((grp) => (
              <div key={grp.universe} className="mb-4">
                <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  {grp.universe}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {grp.categories.map((c) => {
                    const selected = draftIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleDraft(c.id)}
                        disabled={isPending}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors",
                          selected
                            ? "border-[#1e3a8a] bg-blue-50 text-[#1e3a8a]"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                        )}
                      >
                        {selected && (
                          <Check size={14} weight="bold" aria-hidden />
                        )}
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="accent"
              onClick={saveDraft}
              disabled={isPending || draftIds.length === 0}
            >
              {isPending && (
                <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden />
              )}
              Enregistrer ({draftIds.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
