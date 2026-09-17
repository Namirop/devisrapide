import { after } from "next/server";

/**
 * Exécute un effet de bord non bloquant (e-mail, push) après la réponse.
 *
 * Sur Vercel, l'instance gèle dès que la réponse part : une promesse lancée
 * en `void` peut rester suspendue en plein vol. `after()` confie la tâche au
 * `waitUntil` de la plateforme. L'échec est journalisé ici, sans
 * `reportIncident` : les e-mails alertent déjà dans `deliver()`.
 */
export function afterResponse(
  label: string,
  task: () => Promise<unknown>,
): void {
  const run = async () => {
    try {
      await task();
    } catch (err) {
      console.error(`[afterResponse/${label}] échec`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  try {
    after(run);
  } catch {
    // Hors scope de requête, `after()` lève : mieux vaut exécuter sans
    // garantie que faire échouer l'appelant.
    void run();
  }
}
