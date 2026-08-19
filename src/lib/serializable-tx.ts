import { Prisma } from "@prisma/client";

import { reportIncident } from "@/lib/alerting";
import { prisma } from "@/lib/prisma";

/**
 * Nombre total de tentatives (1 essai + 2 reprises). Au-dela, on laisse
 * l'erreur remonter : trois echecs de suite ne sont plus de la contention
 * normale mais un probleme a diagnostiquer.
 */
const MAX_ATTEMPTS = 3;

/** Delai de base entre deux tentatives, en ms (avec jitter). */
const BASE_BACKOFF_MS = 25;

/**
 * Vrai si l'erreur est un echec de serialisation Postgres (SQLSTATE 40001)
 * ou un deadlock (40P01). Prisma remonte les deux sous le code `P2034`.
 *
 * Ce n'est PAS une panne : en isolation `Serializable`, PostgreSQL annule
 * volontairement l'une des transactions d'un cycle de dependances
 * lecture/ecriture. Le contrat de cette isolation est que l'appelant
 * rejoue. Sans ce rejeu, une simple concurrence remonte a l'utilisateur
 * comme une erreur interne.
 */
export function isSerializationFailure(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034"
  );
}

/**
 * Execute `fn` dans une transaction `Serializable`, en rejouant les
 * echecs de serialisation.
 *
 * `fn` DOIT etre rejouable : un rollback annule toutes ses ecritures, donc
 * elle doit relire ce dont elle depend plutot que s'appuyer sur des
 * valeurs capturees avant la transaction. Les erreurs metier
 * (solde insuffisant, lead complet) ne sont jamais rejouees — elles
 * traversent telles quelles.
 *
 * @param label  identifiant court, repris tel quel dans l'incident ouvert
 *               quand les reprises sont epuisees.
 */
export async function runSerializable<T>(
  label: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (err) {
      if (!isSerializationFailure(err)) throw err;

      lastError = err;
      if (attempt < MAX_ATTEMPTS) {
        // Backoff avec jitter : deux transactions qui se sont mutuellement
        // annulees ne doivent pas repartir en meme temps et recollisionner.
        const delayMs = BASE_BACKOFF_MS * attempt * (1 + Math.random());
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  await reportIncident("db.serialization-retries-exhausted", {
    error: lastError,
    context: { label, attempts: MAX_ATTEMPTS },
  });
  throw lastError;
}
