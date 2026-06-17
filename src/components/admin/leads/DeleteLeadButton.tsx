"use client";

import { CircleNotch, Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteLeadAsAdmin } from "@/server/actions/admin-lead";

/**
 * Bouton de suppression d'un lead suspect (Sprint C), sur le détail admin.
 * Confirmation obligatoire dans une modale. Soft-delete côté serveur ; après
 * succès, le détail n'existe plus → redirection vers la liste des leads.
 */
export function DeleteLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    if (pending) return;
    startTransition(async () => {
      const res = await deleteLeadAsAdmin({ leadId });
      if (!res.success) {
        toast.error("Suppression refusée", { description: res.message });
        return;
      }
      toast.success("Lead supprimé.");
      setOpen(false);
      router.push("/admin/leads");
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Trash size={15} weight="regular" aria-hidden />
        Supprimer
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-[18px] font-bold text-slate-900">
              Supprimer ce lead ?
            </DialogTitle>
            <DialogDescription className="text-[13.5px] leading-relaxed text-slate-600">
              Cette action est irréversible. Le lead disparaît des demandes
              disponibles pour les pros. À utiliser pour un faux lead (numéro
              fictif, projet absurde…).
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
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
                  Suppression…
                </>
              ) : (
                "Supprimer définitivement"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
