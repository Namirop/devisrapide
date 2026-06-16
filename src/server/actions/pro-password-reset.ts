"use server";

import { randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";

import { buildPasswordResetUrl } from "@/lib/email/helpers";
import { sendPasswordResetProEmail } from "@/lib/email/sender";
import { prisma } from "@/lib/prisma";
import { passwordResetLimiter } from "@/lib/ratelimit";
import { verifyTurnstileToken } from "@/lib/turnstile/verify";
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "@/schemas/password-reset";

// Server Actions du flow "mot de passe oublié" pro :
//  - requestPasswordReset : envoie le lien de reset (reponse generique pour
//    ne jamais reveler si un email existe).
//  - resetPassword : applique le nouveau mot de passe via le token.

// Token valable 1h. Court par securite : un lien de reset est un bearer
// d'acces au compte, il ne doit pas trainer.
const TOKEN_TTL_MS = 60 * 60 * 1000;

export type RequestPasswordResetResult =
  | { success: true }
  | {
      success: false;
      code: "INVALID_INPUT" | "RATE_LIMITED" | "TURNSTILE_FAILED";
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export async function requestPasswordReset(rawInput: {
  email: string;
  turnstileToken: string;
}): Promise<RequestPasswordResetResult> {
  const parsed = requestPasswordResetSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: "Email invalide.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }
  const { email, turnstileToken } = parsed.data;

  // Rate limit IP : 3 demandes / heure. Anti-spam d'envoi d'emails.
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";
  const rl = await passwordResetLimiter().limit(ip);
  if (!rl.success) {
    return {
      success: false,
      code: "RATE_LIMITED",
      message:
        "Trop de demandes depuis cette adresse. Réessayez dans une heure.",
    };
  }

  // Turnstile anti-bot apres rate limit (pas de quota Cloudflare gaspille
  // sur une IP deja bloquee).
  const turnstile = await verifyTurnstileToken(turnstileToken, ip);
  if (!turnstile.success) {
    return {
      success: false,
      code: "TURNSTILE_FAILED",
      message:
        "Vérification de sécurité échouée. Rechargez la page et réessayez.",
    };
  }

  // Securite : on ne revele jamais si l'email existe. Le travail (creation
  // token + email) n'a lieu que pour un vrai compte pro actif, mais la
  // reponse renvoyee est identique dans tous les cas.
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, deletedAt: true, passwordHash: true },
  });

  if (user && user.role === "PRO" && !user.deletedAt && user.passwordHash) {
    // Un seul lien actif a la fois : on invalide les tokens precedents
    // encore valides avant d'en emettre un nouveau.
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
      data: { used: true },
    });

    const token = randomUUID();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    await sendPasswordResetProEmail({
      to: email,
      resetUrl: buildPasswordResetUrl(token),
    });
  }

  return { success: true };
}

export type ResetPasswordResult =
  | { success: true }
  | {
      success: false;
      code: "INVALID_INPUT" | "TOKEN_INVALID";
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export async function resetPassword(rawInput: {
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<ResetPasswordResult> {
  const parsed = resetPasswordSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }
  const { token, password } = parsed.data;

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: { id: true, userId: true, used: true, expiresAt: true },
  });
  if (!record || record.used || record.expiresAt < new Date()) {
    return {
      success: false,
      code: "TOKEN_INVALID",
      message: "Ce lien est invalide ou a expiré. Veuillez refaire une demande.",
    };
  }

  // Meme methode qu'a l'inscription (bcryptjs, cost 12) pour rester
  // compatible avec authorize() au login. Update + invalidation du token
  // dans une transaction : on ne consomme le token que si le hash a bien
  // ete pose.
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { used: true },
    }),
  ]);

  return { success: true };
}
