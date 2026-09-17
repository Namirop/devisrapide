"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";

import { afterResponse } from "@/lib/after-response";
import { buildAdminProReviewUrl } from "@/lib/email/helpers";
import { sendNewProSignupAdminEmail } from "@/lib/email/sender";
import { validateAndResolvePostalCode } from "@/lib/geo/be-postal";
import { prisma } from "@/lib/prisma";
import { proSignupIdentityLimiter, proSignupLimiter } from "@/lib/ratelimit";
import { verifyTurnstileToken } from "@/lib/turnstile/verify";
import {
  proSignupIdentityCheckSchema,
  proSignupSchema,
} from "@/schemas/pro-signup";

export type ProSignupResult =
  | { success: true; userId: string; proProfileId: string }
  | {
      success: false;
      code:
        | "INVALID_INPUT"
        | "RATE_LIMITED"
        | "TURNSTILE_FAILED"
        | "EMAIL_TAKEN"
        | "VAT_TAKEN"
        | "POSTAL_NOT_FOUND"
        | "INTERNAL";
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

// « shell » : une demande de devis crée un User CLIENT sans mot de passe
// (upsert de createLead) pour rattacher le lead. Ce n'est pas un compte
// utilisable : un particulier ayant déjà demandé un devis peut devenir pro.
type EmailOwnership =
  { kind: "free" } | { kind: "shell"; userId: string } | { kind: "taken" };

async function resolveEmailOwnership(email: string): Promise<EmailOwnership> {
  const existing = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
      passwordHash: true,
      deletedAt: true,
      proProfile: { select: { id: true } },
    },
  });
  if (!existing) return { kind: "free" };

  // Un compte supprimé garde son email : il n'est jamais recyclé.
  const isShell =
    existing.role === "CLIENT" &&
    existing.passwordHash === null &&
    existing.proProfile === null &&
    existing.deletedAt === null;

  return isShell ? { kind: "shell", userId: existing.id } : { kind: "taken" };
}

// Pré-contrôle d'unicité email + TVA en sortie d'étape 1, pour signaler un
// doublon avant les trois étapes suivantes.
//
// Il révèle si un email ou une TVA est déjà inscrit : il est donc limité par
// IP (proSignupIdentityLimiter). Entrée invalide ou limite atteinte →
// { ok: true } : le wizard continue et la vérification finale de
// submitProRegistration fait foi.
export async function checkProSignupIdentity(input: {
  email: string;
  vatNumber: string;
}): Promise<{
  ok: boolean;
  fieldErrors?: { email?: string; vatNumber?: string };
}> {
  const parsed = proSignupIdentityCheckSchema.safeParse(input);
  if (!parsed.success) return { ok: true };
  const { email, vatNumber } = parsed.data;

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";
  const rl = await proSignupIdentityLimiter().limit(ip);
  if (!rl.success) return { ok: true };

  const [ownership, vatExists] = await Promise.all([
    resolveEmailOwnership(email),
    prisma.proProfile.findUnique({
      where: { vatNumber },
      select: { id: true },
    }),
  ]);
  const fieldErrors: { email?: string; vatNumber?: string } = {};
  if (ownership.kind === "taken") fieldErrors.email = "Email déjà utilisé";
  if (vatExists) fieldErrors.vatNumber = "Numéro de TVA déjà enregistré";
  if (fieldErrors.email || fieldErrors.vatNumber) {
    return { ok: false, fieldErrors };
  }
  return { ok: true };
}

export async function submitProRegistration(
  rawInput: unknown,
): Promise<ProSignupResult> {
  const parsed = proSignupSchema.safeParse(rawInput);
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
  const input = parsed.data;

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";
  const rl = await proSignupLimiter().limit(ip);
  if (!rl.success) {
    return {
      success: false,
      code: "RATE_LIMITED",
      message:
        "Trop d'inscriptions depuis cette adresse. Réessayez dans une heure.",
    };
  }

  // Turnstile après la limite de débit : pas d'appel Cloudflare pour une IP
  // déjà bloquée.
  const turnstileResult = await verifyTurnstileToken(input.turnstileToken, ip);
  if (!turnstileResult.success) {
    return {
      success: false,
      code: "TURNSTILE_FAILED",
      message:
        "Vérification de sécurité échouée. Rechargez la page et réessayez.",
    };
  }

  // Les contraintes @unique protègent déjà la base ; ce contrôle donne un
  // message clair avant l'insertion.
  const [ownership, vatExists] = await Promise.all([
    resolveEmailOwnership(input.email),
    prisma.proProfile.findUnique({
      where: { vatNumber: input.vatNumber },
    }),
  ]);
  if (ownership.kind === "taken") {
    return {
      success: false,
      code: "EMAIL_TAKEN",
      message: "Un compte existe déjà avec cet email.",
      fieldErrors: { email: ["Email déjà utilisé"] },
    };
  }
  if (vatExists) {
    return {
      success: false,
      code: "VAT_TAKEN",
      message: "Ce numéro de TVA est déjà enregistré.",
      fieldErrors: { vatNumber: ["Numéro de TVA déjà enregistré"] },
    };
  }

  // Le point d'ancrage du matching est le code postal de zone (étape 3), pas
  // celui de l'entreprise (étape 1).
  const geo = validateAndResolvePostalCode(input.zonePostalCode);
  if (!geo.valid) {
    return {
      success: false,
      code: "POSTAL_NOT_FOUND",
      message: "Code postal de la zone d'intervention introuvable.",
      fieldErrors: { zonePostalCode: ["Code postal introuvable"] },
    };
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Une coquille CLIENT est promue en PRO plutôt que dupliquée : ses
      // demandes de devis restent rattachées au même User.
      const user =
        ownership.kind === "shell"
          ? await tx.user.update({
              where: { id: ownership.userId },
              data: {
                role: "PRO",
                passwordHash,
                phone: input.phone,
                firstName: input.firstName,
                lastName: input.lastName,
              },
              select: { id: true },
            })
          : await tx.user.create({
              data: {
                email: input.email,
                phone: input.phone,
                firstName: input.firstName,
                lastName: input.lastName,
                role: "PRO",
                passwordHash,
              },
              select: { id: true },
            });

      const proProfile = await tx.proProfile.create({
        data: {
          userId: user.id,
          companyName: input.companyName,
          vatNumber: input.vatNumber,
          validationStatus: "PENDING",
          postalCode: input.zonePostalCode,
          city: geo.commune,
          latitude: geo.lat,
          longitude: geo.lng,
          interventionRadiusKm: input.radiusKm,
          categories: {
            create: input.categoryIds.map((categoryId) => ({ categoryId })),
          },
        },
        select: { id: true },
      });

      return { userId: user.id, proProfileId: proProfile.id };
    });

    // Un pro PENDING ne reçoit aucun lead avant validation : les admins sont
    // prévenus. Hors du chemin bloquant (une indisponibilité de l'envoi
    // d'emails ne doit pas faire échouer l'inscription), via afterResponse
    // pour que l'envoi survive au gel de l'instance.
    afterResponse("newProSignupAdmin", () =>
      notifyAdminsOfNewPro({
        proProfileId: result.proProfileId,
        companyName: input.companyName,
        contactName: `${input.firstName} ${input.lastName}`,
        email: input.email,
        phone: input.phone,
        vatNumber: input.vatNumber ?? null,
        city: geo.commune,
        postalCode: input.zonePostalCode,
        categoryIds: input.categoryIds,
      }),
    );

    return {
      success: true,
      userId: result.userId,
      proProfileId: result.proProfileId,
    };
  } catch (err) {
    console.error("[submitProRegistration] DB failure", err);
    return {
      success: false,
      code: "INTERNAL",
      message: "Une erreur interne est survenue. Réessayez dans un instant.",
    };
  }
}

/**
 * Prévient les admins qu'une candidature attend leur validation.
 * Destinataires lus en base (rôle ADMIN, non supprimé) plutôt que dans une
 * variable d'environnement, qui se périmerait en silence.
 */
async function notifyAdminsOfNewPro(input: {
  proProfileId: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  vatNumber: string | null;
  city: string;
  postalCode: string;
  categoryIds: string[];
}): Promise<void> {
  const [admins, categories] = await Promise.all([
    prisma.user.findMany({
      where: { role: "ADMIN", deletedAt: null },
      select: { email: true },
    }),
    prisma.category.findMany({
      where: { id: { in: input.categoryIds } },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  await sendNewProSignupAdminEmail({
    to: admins.map((a) => a.email),
    proProfileId: input.proProfileId,
    companyName: input.companyName,
    contactName: input.contactName,
    email: input.email,
    phone: input.phone,
    vatNumber: input.vatNumber,
    city: input.city,
    postalCode: input.postalCode,
    categoryNames: categories.map((c) => c.name),
    reviewUrl: buildAdminProReviewUrl(input.proProfileId),
  });
}
