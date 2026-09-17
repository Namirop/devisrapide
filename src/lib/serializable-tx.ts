import { Prisma } from "@prisma/client";

import { reportIncident } from "@/lib/alerting";
import { prisma } from "@/lib/prisma";

/** 1 essai + 2 reprises : au-delà, ce n'est plus de la contention normale. */
const MAX_ATTEMPTS = 3;

const BASE_BACKOFF_MS = 25;

/**
 * Échec de sérialisation (40001) ou deadlock (40P01), remontés par Prisma
 * sous `P2034`. En `Serializable`, PostgreSQL annule volontairement une
 * transaction du cycle : c'est à l'appelant de rejouer.
 */
export function isSerializationFailure(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034"
  );
}

/**
 * Exécute `fn` en transaction `Serializable` en rejouant les échecs de
 * sérialisation. `fn` doit être rejouable : relire en base ce dont elle
 * dépend plutôt que des valeurs capturées avant. Les erreurs métier ne sont
 * pas rejouées. `label` identifie l'incident si les reprises s'épuisent.
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
        // Jitter : deux transactions en conflit ne doivent pas repartir
        // ensemble et entrer à nouveau en collision.
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
