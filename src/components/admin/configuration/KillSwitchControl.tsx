"use client";

import { CircleNotch, Power, Warning } from "@phosphor-icons/react";
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
import { toggleLeadCreation } from "@/server/actions/admin-config";

/**
 * Pilote le kill switch « création de demandes ». L'action (suspendre /
 * réactiver) exige une confirmation par mot de passe admin dans une modale
 * (re-auth bcrypt côté serveur). Après succès, router.refresh() pour
 * resynchroniser l'état + la bannière du layout admin.
 */
export function KillSwitchControl({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useSafeTransition();

  // L'action vise l'état inverse de l'état courant.
  const targetEnabled = !enabled;

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!password || pending) return;
    startTransition(async () => {
      const res = await toggleLeadCreation({ enabled: targetEnabled, password });
      if (!res.success) {
        toast.error("Action refusée", { description: res.message });
        return;
      }
      toast.success(
        res.enabled
          ? "Création de demandes réactivée."
          : "Création de demandes suspendue.",
      );
      setPassword("");
      setDialogOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <span
            className={
              enabled
                ? "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600"
                : "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600"
            }
            aria-hidden
          >
            <Power size={20} weight="bold" />
          </span>
          <div>
            <p className="text-[14px] font-semibold text-slate-900">
              Création de demandes —{" "}
              {enabled ? (
                <span className="text-emerald-700">Activée</span>
              ) : (
                <span className="text-rose-700">Suspendue</span>
              )}
            </p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-500">
              {enabled
                ? "Les particuliers peuvent soumettre de nouvelles demandes."
                : "Le formulaire /demande est masqué et toute nouvelle demande est refusée."}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant={enabled ? "outline" : "accent"}
          onClick={() => setDialogOpen(true)}
          className="shrink-0"
        >
          {enabled ? "Suspendre" : "Réactiver"}
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-[18px] font-bold text-slate-900">
              {targetEnabled
                ? "Réactiver la création de demandes ?"
                : "Suspendre la création de demandes ?"}
            </DialogTitle>
            <DialogDescription className="text-[13.5px] leading-relaxed text-slate-600">
              {targetEnabled
                ? "Les particuliers pourront à nouveau soumettre des demandes immédiatement."
                : "Le formulaire public sera masqué et toute nouvelle demande refusée, jusqu'à réactivation. Les pros et l'admin ne sont pas affectés."}
            </DialogDescription>
          </DialogHeader>

          {!targetEnabled && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-900">
              <Warning size={16} weight="fill" className="mt-px shrink-0" aria-hidden />
              <span>
                À n&apos;utiliser qu&apos;en cas de spam ou d&apos;incident. Pense à
                réactiver dès que possible.
              </span>
            </div>
          )}

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
                variant={targetEnabled ? "accent" : "destructive"}
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
                    Confirmation…
                  </>
                ) : targetEnabled ? (
                  "Réactiver"
                ) : (
                  "Suspendre"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
