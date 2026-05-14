"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CircleNotch,
  Pause,
  Play,
  X,
} from "@phosphor-icons/react";
import type { ProValidationStatus } from "@prisma/client";
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
import {
  reactivateProProfile,
  rejectProProfile,
  suspendProProfile,
  validateProProfile,
} from "@/server/actions/admin-pro-lifecycle";

type Props = {
  proProfileId: string;
  status: ProValidationStatus;
};

/**
 * Panneau d'actions admin sur un pro. Affiche les boutons disponibles
 * selon validationStatus :
 *  - PENDING  → "Valider" (vert) + "Refuser" (rouge, modal raison)
 *  - VALIDATED → "Suspendre" (rouge, modal raison)
 *  - SUSPENDED → "Réactiver" (vert)
 *  - REJECTED → "Réactiver" (vert, transition vers VALIDATED V1)
 *
 * Toutes les actions sont des Server Actions admin-actions.ts qui
 * revalidate les paths admin concernes apres update.
 */
export function ProActionPanel({ proProfileId, status }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "PENDING" && (
        <>
          <ValidateButton proProfileId={proProfileId} />
          <RejectButton proProfileId={proProfileId} />
        </>
      )}
      {status === "VALIDATED" && (
        <SuspendButton proProfileId={proProfileId} />
      )}
      {(status === "SUSPENDED" || status === "REJECTED") && (
        <ReactivateButton proProfileId={proProfileId} />
      )}
    </div>
  );
}

function ValidateButton({ proProfileId }: { proProfileId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await validateProProfile({ proProfileId });
      if (!result.success) {
        toast.error("Validation impossible", { description: result.message });
        return;
      }
      toast.success("Pro validé");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-4 py-2 text-[13.5px] font-semibold text-white transition-colors",
        pending
          ? "cursor-not-allowed bg-emerald-300"
          : "bg-emerald-600 hover:bg-emerald-700",
      )}
    >
      {pending ? (
        <CircleNotch size={14} weight="bold" className="animate-spin" aria-hidden />
      ) : (
        <Check size={14} weight="bold" aria-hidden />
      )}
      Valider
    </button>
  );
}

function RejectButton({ proProfileId }: { proProfileId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await rejectProProfile({ proProfileId, reason: reason.trim() });
      if (!result.success) {
        toast.error("Refus impossible", { description: result.message });
        return;
      }
      toast.success("Pro refusé");
      setOpen(false);
      setReason("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-white px-4 py-2 text-[13.5px] font-semibold text-rose-700 transition-colors hover:bg-rose-50">
        <X size={14} weight="bold" aria-hidden />
        Refuser
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="font-display text-[20px]">
            Refuser la candidature
          </DialogTitle>
          <DialogDescription>
            La raison sera incluse dans l&apos;email envoyé au pro. Soyez
            explicite (TVA invalide, justificatif manquant, etc.).
          </DialogDescription>
        </DialogHeader>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="Raison du refus (10 caractères min)…"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-[14px] text-slate-900 focus:border-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-600/20"
        />
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
            disabled={pending || reason.trim().length < 10}
            className="gap-2 bg-rose-600 text-white hover:bg-rose-700"
          >
            {pending ? (
              <CircleNotch size={14} weight="bold" className="animate-spin" aria-hidden />
            ) : null}
            Refuser
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SuspendButton({ proProfileId }: { proProfileId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await suspendProProfile({ proProfileId, reason: reason.trim() });
      if (!result.success) {
        toast.error("Suspension impossible", { description: result.message });
        return;
      }
      toast.success("Pro suspendu");
      setOpen(false);
      setReason("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-white px-4 py-2 text-[13.5px] font-semibold text-rose-700 transition-colors hover:bg-rose-50">
        <Pause size={14} weight="bold" aria-hidden />
        Suspendre
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="font-display text-[20px]">
            Suspendre le pro
          </DialogTitle>
          <DialogDescription>
            Le pro perd l&apos;accès à son dashboard et la raison sera
            envoyée par email. Réactivable à tout moment.
          </DialogDescription>
        </DialogHeader>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="Raison de la suspension (10 caractères min)…"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-[14px] text-slate-900 focus:border-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-600/20"
        />
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
            disabled={pending || reason.trim().length < 10}
            className="gap-2 bg-rose-600 text-white hover:bg-rose-700"
          >
            {pending ? (
              <CircleNotch size={14} weight="bold" className="animate-spin" aria-hidden />
            ) : null}
            Suspendre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReactivateButton({ proProfileId }: { proProfileId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await reactivateProProfile({ proProfileId });
      if (!result.success) {
        toast.error("Réactivation impossible", { description: result.message });
        return;
      }
      toast.success("Pro réactivé");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-4 py-2 text-[13.5px] font-semibold text-white transition-colors",
        pending
          ? "cursor-not-allowed bg-emerald-300"
          : "bg-emerald-600 hover:bg-emerald-700",
      )}
    >
      {pending ? (
        <CircleNotch size={14} weight="bold" className="animate-spin" aria-hidden />
      ) : (
        <Play size={14} weight="bold" aria-hidden />
      )}
      Réactiver
    </button>
  );
}
