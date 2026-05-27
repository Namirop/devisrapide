"use client";

import { useTransition } from "react";
import type { ComponentType } from "react";
import {
  CircleNotch,
  Crown,
  Gift,
  Lightning,
  Rocket,
  Star,
  Sparkle,
  X,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { createCheckoutSession } from "@/server/actions/wallet-actions";
import type { WalletPack } from "@/server/queries/wallet";

type Props = {
  pack: WalletPack;
};

// Metadata visuelle co-locale ici : icone, nom d'affichage, sous-titre
// marketing et couleur d'icone. Pas dans AppConfig.WALLET_PACKS — Kamel
// peut bouger prix / bonus depuis l'admin sans toucher au visuel.
type PackVisuals = {
  displayName: string;
  Icon: ComponentType<{ size?: number; weight?: "regular" | "bold" | "fill"; className?: string }>;
  iconClass: string;
  iconBgClass: string;
  subtitle: string;
};

const PACK_VISUALS: Record<string, PackVisuals> = {
  decouverte: {
    displayName: "Pack Découverte",
    Icon: Rocket,
    iconClass: "text-slate-500",
    iconBgClass: "bg-slate-100",
    subtitle: "Le pack idéal pour tester la plateforme.",
  },
  boost: {
    displayName: "Pack BOOST",
    Icon: Lightning,
    iconClass: "text-[#1e3a8a]",
    iconBgClass: "bg-blue-50",
    subtitle: "Plus de budget pour plus d'opportunités.",
  },
  domination: {
    displayName: "Pack DOMINATION",
    Icon: Crown,
    iconClass: "text-amber-500",
    iconBgClass: "bg-amber-50",
    subtitle: "Le meilleur rapport crédit pour dominer votre marché.",
  },
};

const FALLBACK_VISUALS: PackVisuals = {
  displayName: "Pack",
  Icon: Sparkle,
  iconClass: "text-slate-500",
  iconBgClass: "bg-slate-100",
  subtitle: "",
};

export function PackCard({ pack }: Props) {
  const [pending, startTransition] = useTransition();
  const visuals = PACK_VISUALS[pack.id] ?? {
    ...FALLBACK_VISUALS,
    displayName: `Pack ${pack.label}`,
  };
  const { Icon } = visuals;
  const hasBonus = pack.bonusEur > 0;
  const bonusPct = hasBonus
    ? Math.round((pack.bonusEur / pack.priceEur) * 100)
    : 0;

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
        "relative flex flex-col rounded-2xl border bg-white p-7 shadow-sm sm:p-8",
        pack.featured
          ? "border-2 border-[#1e3a8a] bg-blue-50/40"
          : "border-slate-200",
      )}
    >
      {pack.featured && (
        <span
          className="absolute left-1/2 top-0 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-[#1e3a8a] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white shadow-md"
          aria-label="Pack populaire"
        >
          <Star size={12} weight="fill" className="text-amber-300" />
          Le plus populaire
        </span>
      )}

      {/* Icon en rond */}
      <div className="flex justify-center">
        <span
          className={cn(
            "inline-flex h-20 w-20 items-center justify-center rounded-full",
            visuals.iconBgClass,
          )}
          aria-hidden
        >
          <Icon size={38} weight="regular" className={visuals.iconClass} />
        </span>
      </div>

      {/* Nom du pack */}
      <h3 className="font-display mt-5 text-center text-[20px] font-bold tracking-tight text-slate-900 sm:text-[22px]">
        {visuals.displayName}
      </h3>

      {/* Prix XXL */}
      <p className="font-display mt-4 text-center text-[56px] font-bold leading-none tracking-tight text-slate-900 sm:text-[64px]">
        {pack.priceEur}&nbsp;€
      </p>

      {/* Pill crédit */}
      <div className="mt-5 flex justify-center">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-4 py-1.5 text-[14px] font-semibold",
            hasBonus
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-600",
          )}
        >
          Crédit&nbsp;: {pack.creditEur}&nbsp;€
        </span>
      </div>

      {/* Séparateur */}
      <div className="my-6 h-px bg-slate-200" />

      {/* Ligne bonus — min-h fixe pour que les 3 cards alignent
          visuellement leur bloc bonus (le Pack sans bonus n'a qu'une
          ligne, les autres en ont deux). Centre verticalement le
          contenu pour eviter un decalage visuel. */}
      <div className="flex min-h-[56px] flex-col items-center justify-center">
        {hasBonus ? (
          <>
            <p className="inline-flex items-center gap-2 text-[17px] font-bold text-emerald-600">
              <Gift size={20} weight="regular" aria-hidden />+{pack.bonusEur}&nbsp;€
              OFFERTS
            </p>
            <p className="mt-1 text-[13.5px] font-medium text-emerald-600/80">
              (+{bonusPct}&nbsp;% de budget)
            </p>
          </>
        ) : (
          <p className="inline-flex items-center gap-1.5 text-[15px] font-medium text-orange-500">
            <X size={16} weight="bold" aria-hidden />
            Aucun bonus
          </p>
        )}
      </div>

      {/* Subtitle marketing */}
      <p className="mt-5 min-h-[48px] text-center text-[15px] leading-relaxed text-slate-500">
        {visuals.subtitle}
      </p>

      {/* CTA en bas */}
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={cn(
          "mt-7 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-[15px] font-semibold transition-colors",
          pending && "cursor-not-allowed opacity-60",
          !pending && pack.featured && "bg-[#1e3a8a] text-white hover:bg-[#1e40af]",
          !pending && !pack.featured &&
            "border border-[#1e3a8a] bg-white text-[#1e3a8a] hover:bg-[#1e3a8a]/5",
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
          "Recharger maintenant"
        )}
      </button>
    </div>
  );
}
