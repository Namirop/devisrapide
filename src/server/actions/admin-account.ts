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

// Même forme de résultat que le reste du panel admin : code stable pour la
// logique côté client, message lisible pour l'UI.

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
      code: "INVALID_INPUT" | "WRONG_PASSWORD" | "PASSWORD_NOT_SET" | "UNKNOWN";
      message: string;
    };

/**
 * Change l'email de l'admin connecté (mot de passe actuel + unicité vérifiés).
 * Le userId vient de la session, jamais de l'input : un admin ne peut modifier
 * que son propre compte.
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
 * Change le mot de passe de l'admin connecté, après vérification de l'actuel.
 * Force minimale imposée par le schéma Zod (10 caractères, majuscule,
 * minuscule, chiffre).
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
