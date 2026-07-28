"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { useSafeTransition } from "@/hooks/use-safe-transition";
import {
  acceptLeadAssignment,
  refuseLeadAssignment,
} from "@/server/actions/lead-assignment";

type Props = {
  assignmentId: string;
  priceLabel: string; // ex: "32,50 €"
  canAfford: boolean;
  exclusivePriceLabel: string; // ex: "81,25 €"
  exclusiveAvailable: boolean; // false si le lead a deja >=1 acheteur (ou expire)
  canAffordExclusive: boolean;
};

/**
 * Barre d'actions de la page detail lead : achat standard, achat exclusif
 * et refus. Client Component qui appelle les Server Actions et gere :
 *   - Toast feedback (success + erreurs typees : LEAD_FULL,
 *     EXCLUSIVE_UNAVAILABLE, INSUFFICIENT_FUNDS, EXPIRED, etc.).
 *   - Redirect post-acceptation vers /dashboard/mes-demandes/[id].
 *   - Redirect post-refus vers /dashboard/leads.
 *   - Modal de confirmation refus avec champ reason optionnel.
 *
 * L'exclusivite est un choix du pro a l'achat, possible uniquement tant que
 * le lead est a 0 acheteur. Aucun compteur n'est affiche cote pro.
 */
export function LeadActionsBar({
  assignmentId,
  priceLabel,
  canAfford,
  exclusivePriceLabel,
  exclusiveAvailable,
  canAffordExclusive,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useSafeTransition();
  const [refuseOpen, setRefuseOpen] = useState(false);
  const [reason, setReason] = useState("");

  function handleAccept(exclusive: boolean) {
    if (exclusive ? !canAffordExclusive : !canAfford) {
      toast.error(
        "Solde wallet insuffisant. Rechargez votre wallet pour acheter ce lead.",
      );
      return;
    }
    startTransition(async () => {
      const result = await acceptLeadAssignment({ assignmentId, exclusive });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(
        exclusive
          ? "Lead acheté en exclusivité. Coordonnées du client disponibles."
          : "Lead acheté. Coordonnées du client disponibles.",
      );
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => setRefuseOpen(true)}
          className="order-3 sm:order-1"
        >
          <X size={16} weight="regular" aria-hidden />
          Refuser ce lead
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending || !exclusiveAvailable || !canAffordExclusive}
          onClick={() => handleAccept(true)}
          className="order-2 h-11 border-[#1e3a8a]/40 px-5 text-[14px] font-semibold text-[#1e3a8a] hover:bg-blue-50 sm:order-2"
        >
          Acheter en exclusivité · {exclusivePriceLabel}
        </Button>
        <Button
          type="button"
          variant="accent"
          disabled={isPending || !canAfford}
          onClick={() => handleAccept(false)}
          className="order-1 h-11 px-5 text-[14px] font-semibold sm:order-3"
        >
          {isPending ? (
            <>
              <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden />
              Traitement…
            </>
          ) : (
            <>Acheter le lead · {priceLabel}</>
          )}
        </Button>
      </div>
      {!exclusiveAvailable && (
        <p className="mt-2 text-right text-[12.5px] text-slate-500">
          Plus disponible en exclusivité — un autre pro a déjà acheté ce lead.
        </p>
      )}

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
