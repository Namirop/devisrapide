"use server";

import bcrypt from "bcryptjs";

import { validateAndResolvePostalCode } from "@/lib/geo/be-postal";
import { prisma } from "@/lib/prisma";
import { proSignupSchema } from "@/schemas/pro-signup";

// Server Action submitProRegistration : valide les 4 etapes du wizard
// inscription pro, cree le User (role PRO + passwordHash) + ProProfile
// (validationStatus PENDING). Retourne un resultat discriminated union.
// L'envoi d'email admin / pro est stub V1 (console.log) — sera branche
// sur Resend au Sprint 5 polish.

export type ProSignupResult =
  | { success: true; userId: string; proProfileId: string }
  | {
      success: false;
      code:
        | "INVALID_INPUT"
        | "EMAIL_TAKEN"
        | "VAT_TAKEN"
        | "POSTAL_NOT_FOUND"
        | "INTERNAL";
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

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

  // Unicite email + vatNumber (cote DB la contrainte @unique tomberait, mais
  // on prefere un message clair avant de tenter le insert).
  const [emailExists, vatExists] = await Promise.all([
    prisma.user.findUnique({ where: { email: input.email } }),
    prisma.proProfile.findUnique({
      where: { vatNumber: input.vatNumber },
    }),
  ]);
  if (emailExists) {
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

  // Resolve la commune + lat/lng depuis le zonePostalCode (point d'ancrage
  // matching). On utilise zonePostalCode (etape 3) — pas postalCode (etape
  // 1, qui peut etre l'adresse facturation).
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
      const user = await tx.user.create({
        data: {
          email: input.email,
          phone: input.phone,
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

    // V1 stub : envoi email admin via console.log. Sprint 5 = Resend.
    console.info("[submitProRegistration] New pro candidate", {
      userId: result.userId,
      proProfileId: result.proProfileId,
      email: input.email,
      companyName: input.companyName,
      vatNumber: input.vatNumber,
    });

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
