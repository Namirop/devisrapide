"use client";

import { useCallback, useTransition } from "react";
import { toast } from "sonner";

const DEFAULT_ERROR_MESSAGE =
  "Une erreur est survenue. Vérifiez votre connexion et réessayez.";

/**
 * `useTransition` qui intercepte les rejets du callback (réseau coupé,
 * exception serveur…) et affiche un toast, au lieu de laisser un bouton
 * bloqué en état pending sans retour. Les erreurs métier
 * (`result.success === false`) restent gérées par chaque appelant.
 */
export function useSafeTransition(
  errorMessage: string = DEFAULT_ERROR_MESSAGE,
): [boolean, (fn: () => Promise<void>) => void] {
  const [isPending, startTransition] = useTransition();

  const run = useCallback(
    (fn: () => Promise<void>) => {
      startTransition(async () => {
        try {
          await fn();
        } catch (err) {
          console.error("[useSafeTransition]", err);
          toast.error(errorMessage);
        }
      });
    },
    [errorMessage],
  );

  return [isPending, run];
}
