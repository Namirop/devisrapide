"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireProSession, UnauthorizedError } from "@/lib/auth-guards";
import { validateAndResolvePostalCode } from "@/lib/geo/be-postal";
import { prisma } from "@/lib/prisma";

// Server Actions du profil pro.

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

// ─── Validation regex partagees (identiques a pro-signup) ──────────
const phoneBeRegex =
  /^(?:(?:\+|00)32[\s.-]?)?(?:0?[1-9])(?:[\s.-]?\d{2}){4}$/;
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

// ─── Toggles notifications (push + email) ─────────────────────────
//
// Master-switches ProProfile.notifyByPush et ProProfile.notifyByEmail.
// Push : respecte par sendPushToProfile().
// Email : respecte par deliver() requiresOptIn pour les templates
// opt-in (new-lead, lead-accepted, low-balance). Les emails essentials
// (recharge, lifecycle admin, lead offert) restent envoyes meme si le
// pro est opt-out — c'est l'UX prevue avec le warning en UI.

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
//
// Met a jour : User.email, User.phone, ProProfile.companyName,
// ProProfile.vatNumber dans une transaction. Re-verifie l'unicite
// email (User) et vatNumber (ProProfile) avant l'update pour donner
// des erreurs claires. Email change : pas de re-auth (session JWT
// indexe sur userId, pas sur email).

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

    // Re-check unicite email + VAT contre les autres comptes.
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
      // Race condition apres notre pre-check : un autre user a pris
      // l'email/VAT entre temps.
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
//
// Remplace l'ensemble des ProCategory du pro. Transaction : delete-all
// + insertMany. Min 1 cat (Zod min(1)).

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

    // Verifie que tous les categoryIds existent (defense contre injection
    // d'IDs aleatoires depuis le client).
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
//
// Update postalCode + radius. Recompute lat/lng via GeoNames pour que
// le matching haversine reste coherent. radiusKm dans {30, 60, -1}.

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
//
// 3 champs : currentPassword + newPassword + confirmPassword. Verifie
// le currentPassword via bcrypt.compare, applique les regles de
// complexite sur newPassword (8 chars min + 1 maj + 1 chiffre),
// confirme la concordance, puis bcrypt.hash + update User.passwordHash.

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

export async function updatePassword(
  rawInput: unknown,
): Promise<ActionResult> {
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
