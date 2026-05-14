"use server";

import bcrypt from "bcryptjs";

import { requireAdminSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import {
  updateAdminEmailSchema,
  updateAdminPasswordSchema,
  type UpdateAdminEmailInput,
  type UpdateAdminPasswordInput,
} from "@/schemas/admin-account";

// Result type aligne sur le reste du panel admin (adjustWalletBalance,
// updateProProfileAdmin, etc.) : success boolean + code stable cote
// client + message lisible cote UI.

type UpdateEmailResult =
  | { success: true }
  | {
      success: false;
      code:
        | "INVALID_INPUT"
        | "WRONG_PASSWORD"
        | "PASSWORD_NOT_SET"
        | "SAME_EMAIL"
        | "EMAIL_CONFLICT"
        | "UNKNOWN";
      message: string;
    };

type UpdatePasswordResult =
  | { success: true }
  | {
      success: false;
      code:
        | "INVALID_INPUT"
        | "WRONG_PASSWORD"
        | "PASSWORD_NOT_SET"
        | "UNKNOWN";
      message: string;
    };

/**
 * Permet a un admin de modifier sa propre adresse email. Verifie le mot
 * de passe actuel + l'unicite de la nouvelle adresse. N'autorise jamais
 * la modification d'un autre admin que soi-meme (le userId vient de la
 * session, pas d'un input).
 */
export async function updateAdminEmail(
  raw: UpdateAdminEmailInput,
): Promise<UpdateEmailResult> {
  const { userId } = await requireAdminSession();

  const parsed = updateAdminEmailSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }
  const { currentPassword, newEmail } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, passwordHash: true },
  });
  if (!user || !user.passwordHash) {
    return {
      success: false,
      code: "PASSWORD_NOT_SET",
      message:
        "Aucun mot de passe défini sur ce compte — impossible de changer l'email.",
    };
  }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    return {
      success: false,
      code: "WRONG_PASSWORD",
      message: "Mot de passe actuel incorrect.",
    };
  }

  if (user.email === newEmail) {
    return {
      success: false,
      code: "SAME_EMAIL",
      message: "Le nouvel email est identique à l'ancien.",
    };
  }

  const conflict = await prisma.user.findUnique({
    where: { email: newEmail },
    select: { id: true },
  });
  if (conflict) {
    return {
      success: false,
      code: "EMAIL_CONFLICT",
      message: "Cet email est déjà utilisé par un autre compte.",
    };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { email: newEmail },
  });

  return { success: true };
}

/**
 * Permet a un admin de modifier son propre mot de passe. Verifie le mdp
 * actuel + force du nouveau (regle Zod, 10 chars / maj / min / chiffre).
 */
export async function updateAdminPassword(
  raw: UpdateAdminPasswordInput,
): Promise<UpdatePasswordResult> {
  const { userId } = await requireAdminSession();

  const parsed = updateAdminPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }
  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user || !user.passwordHash) {
    return {
      success: false,
      code: "PASSWORD_NOT_SET",
      message:
        "Aucun mot de passe défini sur ce compte — contactez le support.",
    };
  }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    return {
      success: false,
      code: "WRONG_PASSWORD",
      message: "Mot de passe actuel incorrect.",
    };
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  return { success: true };
}
