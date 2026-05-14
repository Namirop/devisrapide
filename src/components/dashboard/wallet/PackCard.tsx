"use client";

import { useTransition } from "react";
import { CircleNotch, Sparkle } from "@phosphor-icons/react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { createCheckoutSession } from "@/server/actions/wallet-actions";
import type { WalletPack } from "@/server/queries/wallet";

type Props = {
  pack: WalletPack;
};

export function PackCard({ pack }: Props) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await createCheckoutSession({ packId: pack.id });
      if (!result.success) {
        toast.error("Impossible de démarrer le paiement", {
          description: result.message,
        });
        return;
      }
      // Redirection complete vers Stripe Checkout (sortie de l'app).
      window.location.href = result.sessionUrl;
    });
  }

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-white p-5",
        pack.featured ? "border-[#1e3a8a]" : "border-slate-200",
      )}
    >
      {pack.featured && (
        <span
          className="absolute -top-2.5 right-4 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-white"
          style={{ backgroundColor: "#1e3a8a" }}
        >
          <Sparkle size={12} weight="bold" />
          Populaire
        </span>
      )}
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
        {pack.label}
      </h3>
      <p className="font-display mt-2 text-[40px] font-bold leading-none tracking-tight text-slate-900">
        {pack.priceEur} €
      </p>
      <p className="mt-3 text-[13px] text-slate-600">
        {pack.creditEur} crédits
        {pack.bonusEur > 0 && (
          <span className="ml-1 font-semibold text-emerald-600">
            +{pack.bonusEur}€ bonus
          </span>
        )}
      </p>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={cn(
          "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-[13px] font-semibold transition-colors",
          pending
            ? "cursor-not-allowed bg-slate-200 text-slate-500"
            : "bg-[#ea580c] text-white hover:bg-[#c2410c]",
        )}
      >
        {pending ? (
          <>
            <CircleNotch
              size={14}
              weight="bold"
              className="animate-spin"
              aria-hidden
            />
            Redirection vers Stripe…
          </>
        ) : (
          "Choisir ce pack"
        )}
      </button>
    </div>
  );
}
