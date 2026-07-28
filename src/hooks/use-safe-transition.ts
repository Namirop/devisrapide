"use client";

import { useCallback, useTransition } from "react";
import { toast } from "sonner";

const DEFAULT_ERROR_MESSAGE =
  "Une erreur est survenue. Vérifiez votre connexion et réessayez.";

/**
 * Remplacement direct de `useTransition` : meme signature ([pending, run]),
 * mais capture les rejets du callback (reseau coupe, timeout, exception
 * serveur non catchee...) et affiche un toast au lieu de laisser le
 * pending state bloque indefiniment sans feedback ni recuperation (bug
 * observe sur le tunnel /demande : bouton coince sur "Envoi…", obligeant
 * a recharger la page). Les erreurs "normales" (`result.success === false`
 * etc., deja gerees par chaque appelant) sont inchangees : ce hook ne
 * couvre que les rejets de promesse.
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
