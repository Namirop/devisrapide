"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/**
 * Affiche un toast de feedback apres retour depuis Stripe Checkout :
 *  - ?recharge=success → toast success "Wallet rechargé" + router.refresh
 *    pour rafraichir le solde affiche.
 *  - ?recharge=cancelled → toast info "Paiement annulé".
 *
 * Nettoie ensuite l'URL via router.replace pour eviter re-trigger au
 * refresh / back navigation.
 *
 * Note race condition : Stripe webhook arrive ~<1s apres redirect, mais
 * il peut prendre quelques secondes. router.refresh() est appele
 * immediatement (le solde peut encore etre ancien), un second refresh
 * 3s plus tard rattrape le cas ou le webhook a tarde.
 */
export function WalletToastFeedback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledRef = useRef(false);

  useEffect(() => {
    // Garde contre le double-trigger (StrictMode + re-render).
    if (handledRef.current) return;

    const recharge = searchParams.get("recharge");
    if (recharge !== "success" && recharge !== "cancelled") return;

    handledRef.current = true;

    if (recharge === "success") {
      toast.success("Wallet rechargé avec succès", {
        description:
          "Votre solde est mis à jour. Si vous ne le voyez pas immédiatement, patientez quelques secondes.",
        duration: 6000,
      });
      // Refresh immediate + un second refresh apres 3s pour rattraper
      // le cas ou le webhook Stripe n'est pas encore arrive.
      router.refresh();
      const t = setTimeout(() => router.refresh(), 3000);
      // Cleanup query params (replace, pas push → pas dans l'historique).
      router.replace("/dashboard/wallet?tab=packs", { scroll: false });
      return () => clearTimeout(t);
    }

    if (recharge === "cancelled") {
      toast.info("Paiement annulé", {
        description: "Aucun montant n'a été débité.",
        duration: 4000,
      });
      router.replace("/dashboard/wallet?tab=packs", { scroll: false });
    }
  }, [router, searchParams]);

  return null;
}
