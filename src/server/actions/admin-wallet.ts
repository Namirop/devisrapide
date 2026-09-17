"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { withAuditLog } from "@/lib/audit/log";
import { requireAdminSession } from "@/lib/auth-guards";
import { ActionError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { creditWallet } from "@/lib/wallet/credit";
import {
  WalletInsufficientFundsError,
  debitWalletManual,
} from "@/lib/wallet/debit";

const adjustWalletSchema = z.object({
  proProfileId: z.string().min(1),
  direction: z.enum(["credit", "debit"]),
  amountCents: z.number().int().positive(),
  reason: z
    .string()
    .min(10, "Raison requise (10 caractères minimum).")
    .max(500),
});

export type AdjustWalletResult =
  | { success: true; newBalanceCents: number }
  | {
      success: false;
      code:
        "INVALID_INPUT" | "PRO_NOT_FOUND" | "INSUFFICIENT_FUNDS" | "INTERNAL";
      message: string;
    };

/**
 * Crédit ou débit manuel admin sur le wallet d'un pro, tracé dans l'AuditLog.
 * Passe par les primitives verrouillées de `lib/wallet`, en transaction
 * `Serializable` : un verrou ne protège que si tous les écrivains le prennent,
 * sinon un ajustement concurrent d'un achat de lead écraserait le débit.
 * Pas d'email au pro : le mouvement apparaît dans son wallet.
 */
export async function adjustWalletBalance(
  rawInput: unknown,
): Promise<AdjustWalletResult> {
  const { userId: adminUserId } = await requireAdminSession();

  const parsed = adjustWalletSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: parsed.error.issues[0]?.message ?? "Champs invalides.",
    };
  }
  const { proProfileId, direction, amountCents, reason } = parsed.data;
  const auditAction =
    direction === "credit" ? "WALLET_CREDIT_ADDED" : "WALLET_DEBIT_ADDED";

  try {
    return await withAuditLog<AdjustWalletResult>(
      {
        action: auditAction,
        actorId: adminUserId,
        target: { type: "Wallet", id: proProfileId },
        inputSummary: { proProfileId, direction, amountCents, reason },
        resultSummary: (r) => ({
          success: r.success,
          code: r.success ? null : r.code,
          newBalanceCents: r.success ? r.newBalanceCents : null,
        }),
      },
      async (): Promise<AdjustWalletResult> => {
        try {
          const result = await prisma.$transaction(
            async (tx) => {
              const pro = await tx.proProfile.findUnique({
                where: { id: proProfileId },
                select: { userId: true },
              });
              if (!pro) {
                throw new ActionError("PRO_NOT_FOUND", "Pro introuvable.");
              }

              const movement =
                direction === "credit"
                  ? await creditWallet({
                      tx,
                      proProfileId,
                      proUserId: pro.userId,
                      amountCents,
                      reason,
                      adminActorId: adminUserId,
                    })
                  : await debitWalletManual({
                      tx,
                      proProfileId,
                      proUserId: pro.userId,
                      amountCents,
                      reason,
                      adminActorId: adminUserId,
                    });

              return { newBalance: movement.balanceAfterCents };
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
          );

          revalidatePath("/admin");
          revalidatePath("/admin/transactions");
          revalidatePath(`/admin/professionnels/${proProfileId}`);

          return { success: true, newBalanceCents: result.newBalance };
        } catch (err) {
          // Levée sous verrou : solde réel, pas une lecture périmée.
          if (err instanceof WalletInsufficientFundsError) {
            return {
              success: false,
              code: "INSUFFICIENT_FUNDS",
              message: `Solde insuffisant. Solde actuel : ${(err.available / 100).toFixed(2)}€.`,
            };
          }
          if (err instanceof ActionError) {
            // Refus métier : retourné en Result (audit SUCCESS, success=false).
            return {
              success: false,
              code: err.code as "PRO_NOT_FOUND" | "INSUFFICIENT_FUNDS",
              message: err.message,
            };
          }
          // Autres erreurs : relancées → audit FAILURE.
          throw err;
        }
      },
    );
  } catch (err) {
    console.error("[admin/adjustWalletBalance] failed", {
      adminUserId,
      proProfileId,
      direction,
      amountCents,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      success: false,
      code: "INTERNAL",
      message: "Erreur interne. Réessayez.",
    };
  }
}
