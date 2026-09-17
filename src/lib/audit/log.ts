import type { AuditAction, AuditLogStatus, Prisma } from "@prisma/client";

import { reportIncident } from "@/lib/alerting";
import { prisma } from "@/lib/prisma";

/**
 * Cible d'une action admin. `targetType` est une simple colonne texte en BDD
 * (pas d'enum Prisma, pour ajouter une cible sans migration) ; l'union TS
 * garde les valeurs cohérentes côté code.
 */
export type AuditTarget = {
  type:
    | "ProProfile"
    | "Lead"
    | "LeadAssignment"
    | "Wallet"
    | "Category"
    | "SubCategory"
    | "AppConfig"
    | "User";
  id: string;
};

type WithAuditLogOptions<T> = {
  action: AuditAction;
  actorId: string;
  target: AuditTarget;
  /** Résumé JSON des entrées. Aucune donnée sensible (mot de passe, etc.). */
  inputSummary?: Record<string, unknown>;
  /** Résumé JSON du résultat (`metadata.result`), appelé seulement en succès. */
  resultSummary?: (result: T) => Record<string, unknown>;
};

/**
 * Exécute une Server Action admin sensible et journalise un `AuditLog`
 * SUCCESS ou FAILURE. En échec, l'erreur d'origine est relancée après
 * journalisation. L'écriture de l'audit est best-effort : elle ne fait
 * jamais échouer une opération métier réussie.
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
    // Alerte en plus du log BDD : l'admin ne voit qu'une erreur générique et
    // l'AuditLog n'est consulté qu'a posteriori.
    await reportIncident("admin.action-failed", {
      error: err,
      context: {
        action: options.action,
        targetType: options.target.type,
        targetId: options.target.id,
        actorId: options.actorId,
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
    console.error("[withAuditLog] failed to persist audit log", {
      action: input.action,
      status: input.status,
      actorId: input.actorId,
      target: input.target,
      error: logErr instanceof Error ? logErr.message : String(logErr),
    });
  }
}
