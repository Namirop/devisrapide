"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { reportIncident } from "@/lib/alerting";
import { requireProSession, UnauthorizedError } from "@/lib/auth-guards";
import { validateAndResolvePostalCode } from "@/lib/geo/be-postal";
import { backfillLeadsForPro } from "@/lib/matching/backfill";
import { prisma } from "@/lib/prisma";

// Server Actions du profil pro.

/**
 * Rattrape les leads encore en ligne après un élargissement du périmètre
 * (métier ajouté, zone étendue) : sinon seules les demandes futures
 * parviendraient au pro. Un échec n'annule pas la mise à jour du profil mais
 * ouvre un incident, faute de quoi il passerait inaperçu.
 */
async function backfillAfterScopeChange(proProfileId: string): Promise<void> {
  try {
    await backfillLeadsForPro({ proProfileId });
  } catch (err) {
    await reportIncident("matching.backfill", {
      error: err,
      context: { proProfileId, trigger: "profile-scope-change" },
    });
  }
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: string;
      code?:
        | "UNAUTHORIZED"
        | "INVALID_INPUT"
        | "EMAIL_TAKEN"
        | "VAT_TAKEN"
        | "WRONG_PASSWORD"
        | "POSTAL_NOT_FOUND"
        | "INTERNAL";
      fieldErrors?: Record<string, string[]>;
    };

// ─── Règles de validation, identiques à l'inscription pro ──────────
const phoneBeRegex = /^(?:(?:\+|00)32[\s.-]?)?(?:0?[1-9])(?:[\s.-]?\d{2}){4}$/;
const vatBeRegex = /^BE\d{10}$/;
const postalBeRegex = /^[1-9]\d{3}$/;
const passwordRules = z
  .string()
  .min(8, "Au moins 8 caractères")
  .regex(/[A-Z]/, "Au moins une majuscule")
  .regex(/\d/, "Au moins un chiffre");

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

// ─── Préférences de notification ──────────────────────────────────
// notifyByPush est appliqué par sendPushToProfile(), notifyByEmail par
// deliver() pour les seuls emails opt-in (nouveau lead, lead acheté, solde
// bas). Les emails essentiels (recharge, statut du compte, lead offert)
// partent toujours, ce que l'interface signale.

const toggleNotificationSchema = z.object({
  value: z.boolean(),
});

export async function updateNotifyByPush(
  rawInput: unknown,
): Promise<ActionResult> {
  const parsed = toggleNotificationSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Données invalides.", code: "INVALID_INPUT" };
  }

  try {
    const { proProfileId } = await requireProSession();
    await prisma.proProfile.update({
      where: { id: proProfileId },
      data: { notifyByPush: parsed.data.value },
    });
    revalidatePath("/dashboard/profil");
    return { ok: true, data: undefined };
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { ok: false, error: err.message, code: "UNAUTHORIZED" };
    }
    console.error("[updateNotifyByPush] DB failure", err);
    return {
      ok: false,
      error: "Une erreur interne est survenue.",
      code: "INTERNAL",
    };
  }
}

export async function updateNotifyByEmail(
  rawInput: unknown,
): Promise<ActionResult> {
  const parsed = toggleNotificationSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Données invalides.", code: "INVALID_INPUT" };
  }

  try {
    const { proProfileId } = await requireProSession();
    await prisma.proProfile.update({
      where: { id: proProfileId },
      data: { notifyByEmail: parsed.data.value },
    });
    revalidatePath("/dashboard/profil");
    return { ok: true, data: undefined };
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { ok: false, error: err.message, code: "UNAUTHORIZED" };
    }
    console.error("[updateNotifyByEmail] DB failure", err);
    return {
      ok: false,
      error: "Une erreur interne est survenue.",
      code: "INTERNAL",
    };
  }
}

// ─── updateProProfileIdentity ────────────────────────────────────
// Email, téléphone, raison sociale et TVA en une transaction, après un
// contrôle d'unicité qui donne des erreurs claires. Changer d'email n'exige
// pas de réauthentification : la session JWT repose sur l'userId.

const identityInputSchema = z.object({
  companyName: z.string().min(2, "Nom commercial requis").max(120),
  vatNumber: z
    .string()
    .min(1, "Numéro de TVA requis")
    .regex(vatBeRegex, "Format attendu : BE0123456789"),
  email: z
    .string()
    .min(1, "Email requis")
    .email("Email invalide")
    .transform((s) => s.toLowerCase().trim()),
  phone: z
    .string()
    .min(1, "Téléphone requis")
    .regex(phoneBeRegex, "Numéro belge attendu (ex : 0470 12 34 56)"),
});

export async function updateProProfileIdentity(
  rawInput: unknown,
): Promise<ActionResult> {
  const parsed = identityInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Données invalides.",
      code: "INVALID_INPUT",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }
  const input = parsed.data;

  try {
    const { userId, proProfileId } = await requireProSession();

    const [emailConflict, vatConflict] = await Promise.all([
      prisma.user.findFirst({
        where: { email: input.email, id: { not: userId } },
        select: { id: true },
      }),
      prisma.proProfile.findFirst({
        where: { vatNumber: input.vatNumber, id: { not: proProfileId } },
        select: { id: true },
      }),
    ]);
    if (emailConflict) {
      return {
        ok: false,
        error: "Cet email est déjà utilisé par un autre compte.",
        code: "EMAIL_TAKEN",
        fieldErrors: { email: ["Email déjà utilisé"] },
      };
    }
    if (vatConflict) {
      return {
        ok: false,
        error: "Ce numéro de TVA est déjà enregistré.",
        code: "VAT_TAKEN",
        fieldErrors: { vatNumber: ["Numéro de TVA déjà enregistré"] },
      };
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { email: input.email, phone: input.phone },
      }),
      prisma.proProfile.update({
        where: { id: proProfileId },
        data: {
          companyName: input.companyName,
          vatNumber: input.vatNumber,
        },
      }),
    ]);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profil");
    return { ok: true, data: undefined };
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { ok: false, error: err.message, code: "UNAUTHORIZED" };
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      // Course : email ou TVA pris par un autre compte après le contrôle.
      return {
        ok: false,
        error:
          "Cet email ou numéro de TVA vient d'être pris par un autre compte. Réessayez.",
        code: "INTERNAL",
      };
    }
    console.error("[updateProProfileIdentity] DB failure", err);
    return {
      ok: false,
      error: "Une erreur interne est survenue.",
      code: "INTERNAL",
    };
  }
}

// ─── updateProCategories ──────────────────────────────────────────
// Remplace toutes les catégories du pro (suppression + recréation en
// transaction), puis rattrape les leads des métiers ajoutés.

const categoriesInputSchema = z.object({
  categoryIds: z
    .array(z.string().min(1))
    .min(1, "Sélectionnez au moins une catégorie"),
});

export async function updateProCategories(
  rawInput: unknown,
): Promise<ActionResult> {
  const parsed = categoriesInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
      code: "INVALID_INPUT",
    };
  }
  const { categoryIds } = parsed.data;

  try {
    const { proProfileId } = await requireProSession();

    // Refuse tout identifiant de catégorie inconnu envoyé par le client.
    const existing = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true },
    });
    if (existing.length !== categoryIds.length) {
      return {
        ok: false,
        error: "Une ou plusieurs catégories sont invalides.",
        code: "INVALID_INPUT",
      };
    }

    await prisma.$transaction([
      prisma.proCategory.deleteMany({ where: { proProfileId } }),
      prisma.proCategory.createMany({
        data: categoryIds.map((categoryId) => ({ proProfileId, categoryId })),
      }),
    ]);

    await backfillAfterScopeChange(proProfileId);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profil");
    return { ok: true, data: undefined };
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { ok: false, error: err.message, code: "UNAUTHORIZED" };
    }
    console.error("[updateProCategories] DB failure", err);
    return {
      ok: false,
      error: "Une erreur interne est survenue.",
      code: "INTERNAL",
    };
  }
}

// ─── updateInterventionZone ───────────────────────────────────────
// Code postal et rayon (30, 60 ou -1 = sans limite). Lat/lng sont recalculés
// depuis la table statique des codes postaux pour le matching par distance.

const zoneInputSchema = z.object({
  postalCode: z
    .string()
    .regex(postalBeRegex, "Code postal BE 4 chiffres (ex : 1000)"),
  radiusKm: z.union([z.literal(30), z.literal(60), z.literal(-1)]),
});

export async function updateInterventionZone(
  rawInput: unknown,
): Promise<ActionResult> {
  const parsed = zoneInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
      code: "INVALID_INPUT",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }
  const input = parsed.data;

  const geo = validateAndResolvePostalCode(input.postalCode);
  if (!geo.valid) {
    return {
      ok: false,
      error: "Code postal introuvable.",
      code: "POSTAL_NOT_FOUND",
      fieldErrors: { postalCode: ["Code postal introuvable"] },
    };
  }

  try {
    const { proProfileId } = await requireProSession();
    await prisma.proProfile.update({
      where: { id: proProfileId },
      data: {
        postalCode: input.postalCode,
        city: geo.commune,
        latitude: geo.lat,
        longitude: geo.lng,
        interventionRadiusKm: input.radiusKm,
      },
    });

    await backfillAfterScopeChange(proProfileId);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profil");
    return { ok: true, data: undefined };
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { ok: false, error: err.message, code: "UNAUTHORIZED" };
    }
    console.error("[updateInterventionZone] DB failure", err);
    return {
      ok: false,
      error: "Une erreur interne est survenue.",
      code: "INTERNAL",
    };
  }
}

// ─── updatePassword ───────────────────────────────────────────────
// Exige le mot de passe actuel ; le nouveau suit les règles d'inscription.

const passwordInputSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: passwordRules,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export async function updatePassword(rawInput: unknown): Promise<ActionResult> {
  const parsed = passwordInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
      code: "INVALID_INPUT",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }
  const input = parsed.data;

  try {
    const { userId } = await requireProSession();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash) {
      return {
        ok: false,
        error: "Compte sans mot de passe configuré.",
        code: "INTERNAL",
      };
    }

    const matchesCurrent = await bcrypt.compare(
      input.currentPassword,
      user.passwordHash,
    );
    if (!matchesCurrent) {
      return {
        ok: false,
        error: "Mot de passe actuel incorrect.",
        code: "WRONG_PASSWORD",
        fieldErrors: { currentPassword: ["Mot de passe actuel incorrect"] },
      };
    }

    const newHash = await bcrypt.hash(input.newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { ok: true, data: undefined };
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { ok: false, error: err.message, code: "UNAUTHORIZED" };
    }
    console.error("[updatePassword] DB failure", err);
    return {
      ok: false,
      error: "Une erreur interne est survenue.",
      code: "INTERNAL",
    };
  }
}
