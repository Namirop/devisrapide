"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch, Gift } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSafeTransition } from "@/hooks/use-safe-transition";
import { assignLeadGratis } from "@/server/actions/admin-lead";

type ProOption = {
  id: string;
  companyName: string;
  city: string;
  postalCode: string;
};

type AssignmentStatus = "PENDING" | "ACCEPTED" | "REFUSED" | "EXPIRED";

/** Suffixe affiché dans l'option pour un pro deja assigne sur ce lead.
 *  ACCEPTED est le seul cas non offrable : le pro a deja le lead. */
const ASSIGNED_LABEL: Record<AssignmentStatus, string> = {
  ACCEPTED: "possède déjà ce lead",
  PENDING: "notifié, pas encore acheté",
  REFUSED: "a refusé",
  EXPIRED: "reçu, plus disponible",
};

type Props = {
  leadId: string;
  /** Pros VALIDATED affichables dans le dropdown. */
  pros: ProOption[];
  /** Statut d'assignment des pros deja assignes sur ce lead. Sert a
   *  annoter les options : seul ACCEPTED est desactive. */
  assignmentStatusByProId: { proProfileId: string; status: AssignmentStatus }[];
};

/**
 * Modal "Offrir ce lead à un pro". Bouton declencheur en accent orange
 * (action neutre admin). Selection d'un pro VALIDATED via select natif
 * (pas de search box V1, suffisant a faible volumetrie). Note admin
 * optionnelle stockée dans LeadAssignment.adminGiftNote (champ dedie
 * separe de refusalReason).
 *
 * Tous les pros VALIDATED sont listes, y compris ceux deja assignes : un
 * pro matche puis expire (cas courant — le lead a ete vendu a un autre)
 * reste offrable, l'action recycle son assignment. Les masquer donnait un
 * dropdown qui semblait ignorer les pros les plus actifs.
 */
export function OfferLeadModal({
  leadId,
  pros,
  assignmentStatusByProId,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedProId, setSelectedProId] = useState("");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useSafeTransition();

  const statusByProId = new Map(
    assignmentStatusByProId.map((a) => [a.proProfileId, a.status]),
  );
  const selectedProStatus = selectedProId
    ? statusByProId.get(selectedProId)
    : undefined;

  function handleSubmit() {
    if (!selectedProId) {
      toast.error("Sélectionnez un pro avant de continuer.");
      return;
    }
    startTransition(async () => {
      const result = await assignLeadGratis({
        leadId,
        proProfileId: selectedProId,
        adminNote: note.trim() || undefined,
      });
      if (!result.success) {
        toast.error("Impossible d'offrir le lead", {
          description: result.message,
        });
        return;
      }
      toast.success("Lead offert avec succès", {
        description: "Le pro recevra un email de notification.",
      });
      setOpen(false);
      setSelectedProId("");
      setNote("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 rounded-md bg-[#ea580c] px-4 py-2 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#c2410c]">
        <Gift size={16} weight="regular" aria-hidden />
        Offrir ce lead
      </DialogTrigger>
      <DialogContent className="p-5 sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-display text-[20px]">
            Offrir ce lead à un pro
          </DialogTitle>
          <DialogDescription>
            Le lead sera attribué gratuitement et le pro recevra un email de
            notification. Pas de débit wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pro-select"
              className="text-[13px] font-semibold text-slate-700"
            >
              Professionnel destinataire
            </label>
            <select
              id="pro-select"
              value={selectedProId}
              onChange={(e) => setSelectedProId(e.target.value)}
              className="h-[44px] rounded-md border border-slate-200 bg-white px-3 text-[14px] text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
            >
              <option value="">— Sélectionner un pro —</option>
              {pros.map((p) => {
                const status = statusByProId.get(p.id);
                return (
                  <option
                    key={p.id}
                    value={p.id}
                    disabled={status === "ACCEPTED"}
                  >
                    {p.companyName} · {p.postalCode} {p.city}
                    {status ? ` — ${ASSIGNED_LABEL[status]}` : ""}
                  </option>
                );
              })}
            </select>
            {pros.length === 0 && (
              <p className="text-[12px] text-rose-600">
                Aucun pro validé sur la plateforme.
              </p>
            )}
            {selectedProStatus && selectedProStatus !== "ACCEPTED" && (
              <p className="text-[12px] text-slate-500">
                Ce pro a déjà reçu ce lead sans l&apos;acheter.{" "}
                L&apos;offrir lui redonnera accès aux coordonnées, gratuitement.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="admin-note"
              className="text-[13px] font-semibold text-slate-700"
            >
              Note admin{" "}
              <span className="font-normal text-slate-400">(optionnel)</span>
            </label>
            <textarea
              id="admin-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Ex: Geste commercial suite à un litige précédent…"
              className="resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-[14px] text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
            />
          </div>
        </div>

        <DialogFooter className="-mx-5 -mb-5 flex-row justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
            className="h-9 px-4 text-[13.5px] font-medium"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={pending}
            className="h-9 gap-2 bg-[#ea580c] px-4 text-[13.5px] font-semibold text-white hover:bg-[#c2410c]"
          >
            {pending ? (
              <>
                <CircleNotch
                  size={14}
                  weight="bold"
                  className="animate-spin"
                  aria-hidden
                />
                Envoi…
              </>
            ) : (
              "Offrir le lead"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
