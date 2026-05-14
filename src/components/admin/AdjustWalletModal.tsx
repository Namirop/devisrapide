"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CircleNotch,
  Minus,
  Plus,
  SlidersHorizontal,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { adjustWalletBalance } from "@/server/actions/admin-actions";

type Props = {
  proProfileId: string;
  currentBalanceCents: number;
};

/**
 * Modal "Ajuster le solde wallet" sur la page detail pro admin.
 * Choix radio credit/debit, input montant en €, textarea raison
 * (10 chars min). Server Action adjustWalletBalance gere le check
 * solde-suffisant cote serveur (refuse debit > balance avec error
 * INSUFFICIENT_FUNDS toast cote client).
 */
export function AdjustWalletModal({ proProfileId, currentBalanceCents }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [amountEur, setAmountEur] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const amountCents = Math.round(Number(amountEur.replace(",", ".")) * 100);
  const isAmountValid = Number.isFinite(amountCents) && amountCents > 0;
  const isReasonValid = reason.trim().length >= 10;
  const canSubmit = isAmountValid && isReasonValid && !pending;

  function handleSubmit() {
    if (!canSubmit) return;
    startTransition(async () => {
      const result = await adjustWalletBalance({
        proProfileId,
        direction,
        amountCents,
        reason: reason.trim(),
      });
      if (!result.success) {
        toast.error("Ajustement impossible", { description: result.message });
        return;
      }
      toast.success(
        direction === "credit" ? "Solde crédité" : "Solde débité",
        {
          description: `Nouveau solde : ${(result.newBalanceCents / 100).toFixed(2)} €.`,
        },
      );
      setOpen(false);
      setAmountEur("");
      setReason("");
      setDirection("credit");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 transition-colors hover:bg-slate-50">
        <SlidersHorizontal size={14} weight="regular" aria-hidden />
        Ajuster le solde
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="font-display text-[20px]">
            Ajuster le solde wallet
          </DialogTitle>
          <DialogDescription>
            Solde actuel :{" "}
            <span className="font-semibold text-slate-900">
              {(currentBalanceCents / 100).toFixed(2)} €
            </span>
            . La transaction sera tracée en BDD avec votre user ID admin.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Direction radio */}
          <div className="grid grid-cols-2 gap-2">
            <DirectionButton
              selected={direction === "credit"}
              onClick={() => setDirection("credit")}
              icon={<Plus size={14} weight="bold" />}
              label="Créditer (+)"
              color="emerald"
            />
            <DirectionButton
              selected={direction === "debit"}
              onClick={() => setDirection("debit")}
              icon={<Minus size={14} weight="bold" />}
              label="Débiter (-)"
              color="rose"
            />
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="amount"
              className="text-[13px] font-semibold text-slate-700"
            >
              Montant (€)
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amountEur}
              onChange={(e) => setAmountEur(e.target.value)}
              placeholder="50.00"
              className="h-[44px] rounded-md border border-slate-200 bg-white px-3 text-[14px] text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
            />
          </div>

          {/* Reason */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reason"
              className="text-[13px] font-semibold text-slate-700"
            >
              Raison <span className="font-normal text-slate-400">(10 chars min)</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Ex: Geste commercial suite à un litige, dédommagement client…"
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-[14px] text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose
            disabled={pending}
            className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-4 text-[13.5px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Annuler
          </DialogClose>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "gap-2 text-white",
              direction === "credit"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-rose-600 hover:bg-rose-700",
            )}
          >
            {pending ? (
              <CircleNotch size={14} weight="bold" className="animate-spin" aria-hidden />
            ) : null}
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DirectionButton({
  selected,
  onClick,
  icon,
  label,
  color,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: "emerald" | "rose";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-[13px] font-semibold transition-colors",
        selected
          ? color === "emerald"
            ? "border-emerald-600 bg-emerald-50 text-emerald-700"
            : "border-rose-600 bg-rose-50 text-rose-700"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
