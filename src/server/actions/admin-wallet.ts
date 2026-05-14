"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { withAuditLog } from "@/lib/audit/log";
import { requireAdminSession } from "@/lib/auth-guards";
import { ActionError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

// Action admin sur le wallet d'un pro :
//   adjustWalletBalance — credit ou debit manuel + WalletTransaction tracee.
//
// Wrappee avec withAuditLog (action WALLET_CREDIT_ADDED / WALLET_DEBIT_ADDED).
// Voir docs/conventions.md (Sprint 5b) pour le pattern Result + AuditLog.

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
 * Credit ou debit manuel admin sur le wallet d'un pro. Transaction
 * Prisma atomique :
 *  - direction "credit" : balance += amountCents, WalletTransaction
 *    type ADMIN_CREDIT, raison stockee dans description + adminReason.
 *  - direction "debit" : balance -= amountCents si solde suffisant
 *    (sinon INSUFFICIENT_FUNDS), WalletTransaction type ADMIN_DEBIT.
 *
 * adminActorId est stocke pour audit (champ existant sur
 * WalletTransaction depuis Sprint 2a).
 *
 * Email de notification au pro non envoye V1 (a discuter avec Kamel).
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
          const result = await prisma.$transaction(async (tx) => {
            const pro = await tx.proProfile.findUnique({
              where: { id: proProfileId },
              select: { userId: true, walletBalanceCents: true },
            });
            if (!pro) {
              throw new ActionError("PRO_NOT_FOUND", "Pro introuvable.");
            }

            if (direction === "debit" && pro.walletBalanceCents < amountCents) {
              throw new ActionError(
                "INSUFFICIENT_FUNDS",
                `Solde insuffisant. Solde actuel : ${(pro.walletBalanceCents / 100).toFixed(2)}€.`,
              );
            }

            const newBalance =
              direction === "credit"
                ? pro.walletBalanceCents + amountCents
                : pro.walletBalanceCents - amountCents;

            await tx.proProfile.update({
              where: { id: proProfileId },
              data: { walletBalanceCents: newBalance },
            });

            await tx.walletTransaction.create({
              data: {
                userId: pro.userId,
                type: direction === "credit" ? "ADMIN_CREDIT" : "ADMIN_DEBIT",
                amountCents,
                balanceAfterCents: newBalance,
                description: reason,
                adminReason: reason,
                adminActorId: adminUserId,
              },
            });

            return { newBalance };
          });

          revalidatePath("/admin");
          revalidatePath("/admin/transactions");
          revalidatePath(`/admin/professionnels/${proProfileId}`);

          return { success: true, newBalanceCents: result.newBalance };
        } catch (err) {
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
