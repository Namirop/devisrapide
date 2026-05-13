"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireProSession, UnauthorizedError } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

// Server Actions du profil pro. Le sprint 2b utilise pour commencer
// `toggleAutoAccept` (commit 10). Les autres Server Actions
// (updateProProfileIdentity, updateProCategories, updateInterventionZone,
// updatePassword) sont ajoutees au commit 18.

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: string;
      code?: "UNAUTHORIZED" | "INVALID_INPUT" | "INTERNAL";
    };

const toggleAutoAcceptSchema = z.object({
  value: z.boolean(),
});

export async function toggleAutoAccept(
  rawInput: unknown,
): Promise<ActionResult> {
  const parsed = toggleAutoAcceptSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Donnees invalides.", code: "INVALID_INPUT" };
  }

  try {
    const { proProfileId } = await requireProSession();
    await prisma.proProfile.update({
      where: { id: proProfileId },
      data: { autoAccept: parsed.data.value },
    });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profil");
    return { ok: true, data: undefined };
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { ok: false, error: err.message, code: "UNAUTHORIZED" };
    }
    console.error("[toggleAutoAccept] DB failure", err);
    return {
      ok: false,
      error: "Une erreur interne est survenue.",
      code: "INTERNAL",
    };
  }
}
