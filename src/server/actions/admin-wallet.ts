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

// Action admin sur le wallet d'un pro :
//   adjustWalletBalance — credit ou debit manuel + WalletTransaction tracee.
//
// Wrappee avec withAuditLog (action WALLET_CREDIT_ADDED / WALLET_DEBIT_ADDED).
// Voir docs/conventions.md pour le pattern Result + AuditLog.

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
        | "INVALID_INPUT"
        | "PRO_NOT_FOUND"
        | "INSUFFICIENT_FUNDS"
        | "INTERNAL";
      message: string;
    };

/**
 * Credit ou debit manuel admin sur le wallet d'un pro, via les primitives
 * verrouillees de `lib/wallet` :
 *  - "credit" : `creditWallet` → WalletTransaction ADMIN_CREDIT.
 *  - "debit"  : `debitWalletManual` → ADMIN_DEBIT, refuse si solde
 *    insuffisant (INSUFFICIENT_FUNDS).
 *
 * Transaction `Serializable` + `SELECT ... FOR UPDATE`, comme tout
 * mouvement de wallet. Cette action lisait auparavant le solde via un
 * `findUnique` en READ COMMITTED puis reecrivait une valeur absolue : un
 * ajustement admin concurrent d'une acceptation de lead ecrasait le debit
 * du lead, et `walletBalanceCents` divergeait du journal
 * `WalletTransaction`. Un verrou ne protege que si TOUS les ecrivains le
 * prennent.
 *
 * adminActorId est stocke pour audit (champ existant sur
 * WalletTransaction).
 *
 * Email de notification au pro non envoye V1.
 * Le pro voit le mouvement dans son dashboard wallet.
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
          // Solde insuffisant : leve par la primitive verrouillee, donc sur
          // le solde reellement verrouille et non sur une lecture perimee.
          if (err instanceof WalletInsufficientFundsError) {
            return {
              success: false,
              code: "INSUFFICIENT_FUNDS",
              message: `Solde insuffisant. Solde actuel : ${(err.available / 100).toFixed(2)}€.`,
            };
          }
          if (err instanceof ActionError) {
            // ActionError = business validation, retourne en Result (audit
            // log SUCCESS avec result.success=false).
            return {
              success: false,
              code: err.code as "PRO_NOT_FOUND" | "INSUFFICIENT_FUNDS",
              message: err.message,
            };
          }
          // Autres erreurs : re-throw -> audit FAILURE.
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
