import type { AuditAction, AuditLogStatus, Prisma } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";

import { prisma } from "@/lib/prisma";

/**
 * Cible logguee d'une action admin. `type` est une string libre (pas
 * d'enum Prisma pour rester souple : "ProProfile", "Lead", "Wallet",
 * "Category", etc.). `id` reference la PK metier (cuid Prisma).
 */
export type AuditTarget = {
  type: "ProProfile" | "Lead" | "LeadAssignment" | "Wallet" | "Category" | "User";
  id: string;
};

type WithAuditLogOptions<T> = {
  action: AuditAction;
  actorId: string;
  target: AuditTarget;
  /** Resume des inputs serializable JSON. Pas de PII (mots de passe, etc.). */
  inputSummary?: Record<string, unknown>;
  /**
   * Optionnel : extrait un resume serializable JSON du retour pour le stocker
   * dans `metadata.result`. Appele uniquement si fn() ne throw pas.
   */
  resultSummary?: (result: T) => Record<string, unknown>;
};

/**
 * Wrapper d'audit pour les Server Actions admin sensibles.
 *
 * Garanties :
 *   1. Execute `fn()` normalement, retourne son resultat ou propage son throw.
 *   2. Apres execution (succes OU echec), tente de persister un AuditLog
 *      avec status SUCCESS ou FAILURE et metadata contextualisee.
 *   3. La persistance audit est wrappee dans un try/catch local : si
 *      l'INSERT AuditLog rate (BDD down, contention, etc.), l'action
 *      metier n'est pas impactee. On log juste console.error pour visibility.
 *
 * En cas de throw de `fn()` :
 *   - On enregistre status=FAILURE + metadata.error.message + metadata.error.name
 *   - Puis on re-throw l'erreur originale (l'appelant garde le controle de la
 *     reponse Result type).
 *
 * Pourquoi le pattern try/catch local autour de l'audit : on ne veut JAMAIS
 * faire echouer une operation reussie (ex: validation pro) parce que le log
 * d'audit n'a pas pu s'ecrire. La tracabilite est best-effort post-hoc,
 * jamais bloquante.
 *
 * @example
 *   await withAuditLog(
 *     {
 *       action: "PRO_VALIDATED",
 *       actorId: session.user.id,
 *       target: { type: "ProProfile", id: proProfileId },
 *       inputSummary: { proProfileId },
 *     },
 *     async () => {
 *       // ... mutation Prisma
 *       return { newStatus: "VALIDATED" };
 *     },
 *   );
 */
export async function withAuditLog<T>(
  options: WithAuditLogOptions<T>,
  fn: () => Promise<T>,
): Promise<T> {
  let result: T;
  try {
    result = await fn();
  } catch (err) {
    await persistAuditLog({
      action: options.action,
      actorId: options.actorId,
      target: options.target,
      status: "FAILURE",
      metadata: {
        input: options.inputSummary ?? null,
        error: {
          name: err instanceof Error ? err.name : "UnknownError",
          message: err instanceof Error ? err.message : String(err),
        },
      },
    });
    // Capture Sentry pour visibilite ops (en plus du log BDD).
    // Tags = filtrable cote dashboard Sentry par action + target.
    Sentry.captureException(err, {
      tags: {
        action: options.action,
        targetType: options.target.type,
      },
      extra: {
        actorId: options.actorId,
        targetId: options.target.id,
      },
    });
    throw err;
  }

  await persistAuditLog({
    action: options.action,
    actorId: options.actorId,
    target: options.target,
    status: "SUCCESS",
    metadata: {
      input: options.inputSummary ?? null,
      result: options.resultSummary ? options.resultSummary(result) : null,
    },
  });

  return result;
}

type PersistInput = {
  action: AuditAction;
  actorId: string;
  target: AuditTarget;
  status: AuditLogStatus;
  metadata: Record<string, unknown>;
};

async function persistAuditLog(input: PersistInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        status: input.status,
        actorId: input.actorId,
        targetType: input.target.type,
        targetId: input.target.id,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    });
  } catch (logErr) {
    // L'audit ne doit jamais crasher l'action metier — on log et on continue.
    console.error("[withAuditLog] failed to persist audit log", {
      action: input.action,
      status: input.status,
      actorId: input.actorId,
      target: input.target,
      error: logErr instanceof Error ? logErr.message : String(logErr),
    });
  }
}
