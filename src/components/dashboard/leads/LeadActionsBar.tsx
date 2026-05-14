"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CircleNotch, X } from "@phosphor-icons/react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  acceptLeadAssignment,
  refuseLeadAssignment,
} from "@/server/actions/lead-assignment";

type Props = {
  assignmentId: string;
  priceLabel: string; // ex: "32,50 €"
  canAfford: boolean;
};

/**
 * Barre d'actions Accept / Refuse pour la page detail lead. Client
 * Component qui appelle les Server Actions Sprint 2a et gere :
 *   - Toast feedback (success + erreurs typees : LEAD_FULL,
 *     INSUFFICIENT_FUNDS, EXPIRED, etc.).
 *   - Redirect post-acceptation vers /dashboard/mes-demandes/[id].
 *   - Redirect post-refus vers /dashboard/leads.
 *   - Modal de confirmation refus avec champ reason optionnel.
 */
export function LeadActionsBar({ assignmentId, priceLabel, canAfford }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [refuseOpen, setRefuseOpen] = useState(false);
  const [reason, setReason] = useState("");

  function handleAccept() {
    if (!canAfford) {
      toast.error(
        "Solde wallet insuffisant. Rechargez votre wallet pour acheter ce lead.",
      );
      return;
    }
    startTransition(async () => {
      const result = await acceptLeadAssignment({ assignmentId });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success("Lead acheté. Coordonnées du client disponibles.");
      router.push(`/dashboard/mes-demandes/${assignmentId}`);
    });
  }

  function handleRefuse() {
    startTransition(async () => {
      const result = await refuseLeadAssignment({
        assignmentId,
        reason: reason.trim() || undefined,
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success("Lead refusé.");
      router.push("/dashboard/leads");
    });
  }

  return (
    <>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => setRefuseOpen(true)}
        >
          <X size={16} weight="regular" aria-hidden />
          Refuser ce lead
        </Button>
        <Button
          type="button"
          variant="accent"
          disabled={isPending || !canAfford}
          onClick={handleAccept}
          className="h-11 px-5 text-[14px] font-semibold"
        >
          {isPending ? (
            <>
              <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden />
              Traitement…
            </>
          ) : (
            <>Acheter le lead pour {priceLabel}</>
          )}
        </Button>
      </div>

      <Dialog open={refuseOpen} onOpenChange={setRefuseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Refuser ce lead ?</DialogTitle>
            <DialogDescription>
              Ce lead ne vous sera plus proposé. Indiquez optionnellement
              une raison pour aider à améliorer le matching.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Raison du refus (optionnel)"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="resize-none"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setRefuseOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={handleRefuse}
              className="border-rose-300 text-rose-700 hover:bg-rose-50"
            >
              {isPending ? (
                <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden />
              ) : null}
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
