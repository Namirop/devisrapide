"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { withAuditLog } from "@/lib/audit/log";
import { requireAdminSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

// Action admin sur le profil pro (override hors cycle de vie) :
//   updateProProfileAdmin — modifie companyName, vatNumber, contact User,
//                           radius, autoAccept. Geoloc exclue (V2).
//
// Wrappee avec withAuditLog (action PRO_PROFILE_UPDATED).

const updateProSchema = z.object({
  proProfileId: z.string().min(1),
  // Champs ProProfile autorises (V1 — geoloc + postal exclus, change
  // de zone necessite re-geocode et c'est V2).
  companyName: z.string().min(1).max(200).optional(),
  vatNumber: z.string().min(1).max(50).optional(),
  interventionRadiusKm: z.union([z.literal(30), z.literal(60), z.literal(-1)]).optional(),
  autoAccept: z.boolean().optional(),
  // Champs User autorises.
  email: z.string().email().max(255).optional(),
  phone: z.string().max(50).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
});

export type UpdateProResult =
  | { success: true }
  | {
      success: false;
      code:
        | "INVALID_INPUT"
        | "PRO_NOT_FOUND"
        | "EMAIL_CONFLICT"
        | "VAT_CONFLICT"
        | "INTERNAL";
      message: string;
    };

/**
 * Update admin override sur ProProfile + User d'un pro. V1 : champs
 * limites (companyName, vatNumber, radius, autoAccept, email, phone,
 * firstName, lastName). Geoloc (postalCode/city/lat/lng) exclue —
 * change de zone necessiterait un re-geocode V2.
 *
 * Validation Zod sur chaque champ optionnel. Conflits unique (email
 * deja pris, vatNumber deja pris par un autre pro) catched explicitly
 * → returns EMAIL_CONFLICT ou VAT_CONFLICT.
 *
 * Transaction Prisma atomique (User + ProProfile updates ensemble).
 */
export async function updateProProfileAdmin(
  rawInput: unknown,
): Promise<UpdateProResult> {
  const { userId: adminUserId } = await requireAdminSession();

  const parsed = updateProSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: parsed.error.issues[0]?.message ?? "Champs invalides.",
    };
  }
  const { proProfileId, ...updates } = parsed.data;

  try {
    return await withAuditLog<UpdateProResult>(
      {
        action: "PRO_PROFILE_UPDATED",
        actorId: adminUserId,
        target: { type: "ProProfile", id: proProfileId },
        // inputSummary expose les CHAMPS modifies (pas les valeurs sensibles
        // brutes comme l'email — on note juste quels champs ont change).
        inputSummary: {
          proProfileId,
          fieldsChanged: Object.keys(updates),
        },
        resultSummary: (r) => ({
          success: r.success,
          code: r.success ? null : r.code,
        }),
      },
      async (): Promise<UpdateProResult> => {
        try {
          const pro = await prisma.proProfile.findUnique({
            where: { id: proProfileId },
            select: { id: true, userId: true },
          });
          if (!pro) {
            return { success: false, code: "PRO_NOT_FOUND", message: "Pro introuvable." };
          }

          const proFields = {
            ...(updates.companyName !== undefined && { companyName: updates.companyName }),
            ...(updates.vatNumber !== undefined && { vatNumber: updates.vatNumber }),
            ...(updates.interventionRadiusKm !== undefined && {
              interventionRadiusKm: updates.interventionRadiusKm,
            }),
            ...(updates.autoAccept !== undefined && { autoAccept: updates.autoAccept }),
          };
          const userFields = {
            ...(updates.email !== undefined && { email: updates.email }),
            ...(updates.phone !== undefined && { phone: updates.phone }),
            ...(updates.firstName !== undefined && { firstName: updates.firstName }),
            ...(updates.lastName !== undefined && { lastName: updates.lastName }),
          };

          await prisma.$transaction(async (tx) => {
            if (Object.keys(proFields).length > 0) {
              await tx.proProfile.update({
                where: { id: proProfileId },
                data: proFields,
              });
            }
            if (Object.keys(userFields).length > 0) {
              await tx.user.update({
                where: { id: pro.userId },
                data: userFields,
              });
            }
          });

          revalidatePath("/admin");
          revalidatePath("/admin/professionnels");
          revalidatePath(`/admin/professionnels/${proProfileId}`);
          return { success: true };
        } catch (err) {
          // Conflits unique Prisma : P2002 sur User.email ou ProProfile.vatNumber.
          // Business outcome -> Result, pas de re-throw (audit log SUCCESS
          // avec result.success=false).
          if (
            err instanceof Error &&
            "code" in err &&
            (err as { code: string }).code === "P2002"
          ) {
            const target = (err as { meta?: { target?: string[] } }).meta?.target;
            if (target?.includes("email")) {
              return {
                success: false,
                code: "EMAIL_CONFLICT",
                message: "Cet email est déjà utilisé par un autre compte.",
              };
            }
            if (target?.includes("vatNumber")) {
              return {
                success: false,
                code: "VAT_CONFLICT",
                message: "Ce numéro de TVA est déjà utilisé par un autre pro.",
              };
            }
          }
          // Autres erreurs : re-throw -> audit FAILURE + outer catch INTERNAL.
          throw err;
        }
      },
    );
  } catch (err) {
    console.error("[admin/updateProProfileAdmin] failed", {
      proProfileId,
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, code: "INTERNAL", message: "Erreur interne." };
  }
}
