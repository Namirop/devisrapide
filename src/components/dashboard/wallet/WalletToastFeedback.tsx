"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/**
 * Toast de retour de Stripe Checkout (`?recharge=success|cancelled`), puis
 * nettoyage de l'URL pour qu'un rechargement ne le réaffiche pas. Le crédit
 * arrive par webhook, parfois après la redirection : d'où un rafraîchissement
 * immédiat doublé d'un second, programmé 3 s plus tard.
 */
export function WalletToastFeedback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledRef = useRef(false);

  useEffect(() => {
    // Évite un double déclenchement (StrictMode, re-rendu).
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
      router.refresh();
      const t = setTimeout(() => router.refresh(), 3000);
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
