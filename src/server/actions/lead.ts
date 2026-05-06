"use server";

import { headers } from "next/headers";

import { getAppConfig } from "@/lib/config";
import { sendLeadReceivedEmail } from "@/lib/email/sender";
import { geocodePostalCode, isGeocodeError } from "@/lib/geo/ban";
import { matchLead } from "@/lib/matching";
import { prisma } from "@/lib/prisma";
import { createLeadLimiter } from "@/lib/ratelimit";
import { createLeadSchema } from "@/schemas/lead";

export type CreateLeadResult =
  | { success: true; leadId: string }
  | {
      success: false;
      code:
        | "INVALID_INPUT"
        | "RATE_LIMITED"
        | "INVALID_POSTAL_CODE"
        | "GEOCODING_UPSTREAM"
        | "SUBCATEGORY_NOT_FOUND"
        | "INTERNAL";
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export async function createLead(
  rawInput: unknown,
): Promise<CreateLeadResult> {
  // Normalisation côté serveur (trim + email lowercase) avant validation.
  const normalized =
    typeof rawInput === "object" && rawInput !== null
      ? (() => {
          const obj = rawInput as Record<string, unknown>;
          const out: Record<string, unknown> = { ...obj };
          for (const k of [
            "firstName",
            "lastName",
            "phone",
            "postalCode",
            "address",
            "description",
          ]) {
            if (typeof obj[k] === "string") out[k] = (obj[k] as string).trim();
          }
          if (typeof obj.email === "string") {
            out.email = obj.email.trim().toLowerCase();
          }
          return out;
        })()
      : rawInput;
  const parsed = createLeadSchema.safeParse(normalized);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: "Données du formulaire invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }
  const input = parsed.data;

  // ─── Rate limit (5 / IP / heure) ────────────────────────────
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";
  const rl = await createLeadLimiter().limit(ip);
  if (!rl.success) {
    return {
      success: false,
      code: "RATE_LIMITED",
      message:
        "Trop de demandes envoyées depuis cette adresse. Réessayez dans une heure.",
    };
  }

  // ─── Lookup catégorie + prix actuels (snapshot à la création) ────
  const subCategory = await prisma.subCategory.findFirst({
    where: { id: input.subCategoryId, isActive: true },
    include: { category: true },
  });
  if (!subCategory) {
    return {
      success: false,
      code: "SUBCATEGORY_NOT_FOUND",
      message: "La sous-catégorie sélectionnée n'est plus disponible.",
    };
  }
  const sharedPrice =
    subCategory.sharedLeadPriceCents ??
    subCategory.category.defaultSharedLeadPriceCents;
  const exclusivePrice =
    subCategory.exclusiveLeadPriceCents ??
    subCategory.category.defaultExclusiveLeadPriceCents;

  // ─── Géocodage BAN ──────────────────────────────────────────
  let geo;
  try {
    geo = await geocodePostalCode(input.postalCode);
  } catch (err) {
    if (isGeocodeError(err)) {
      if (err.kind === "NOT_FOUND") {
        return {
          success: false,
          code: "INVALID_POSTAL_CODE",
          message: "Code postal introuvable.",
          fieldErrors: { postalCode: ["Code postal introuvable"] },
        };
      }
      return {
        success: false,
        code: "GEOCODING_UPSTREAM",
        message:
          "Service de géocodage temporairement indisponible. Réessayez dans un instant.",
      };
    }
    console.error("[createLead] unexpected geocode error", err);
    return {
      success: false,
      code: "INTERNAL",
      message: "Une erreur interne est survenue. Réessayez dans un instant.",
    };
  }

  // ─── Config palier initial + timeout global ─────────────────
  const radiusPaliers = await getAppConfig("RADIUS_PALIERS_KM", "json");
  const initialRadius = Array.isArray(radiusPaliers)
    ? Number(radiusPaliers[0]) || 25
    : 25;
  const timeoutHours = await getAppConfig("LEAD_GLOBAL_TIMEOUT_HOURS", "int");
  const expiresAt = new Date(Date.now() + timeoutHours * 60 * 60 * 1000);

  // ─── Upsert User CLIENT + Create Lead (transaction) ─────────
  let leadId: string;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email: input.email },
        update: {
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
        },
        create: {
          email: input.email,
          role: "CLIENT",
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
        },
      });

      const lead = await tx.lead.create({
        data: {
          status: "PENDING_MATCH",
          clientId: user.id,
          clientFirstName: input.firstName,
          clientLastName: input.lastName,
          clientEmail: input.email,
          clientPhone: input.phone,
          subCategoryId: subCategory.id,
          description: input.description,
          urgency: input.urgency,
          postalCode: geo.postalCode,
          city: geo.city,
          address: input.address || null,
          latitude: geo.latitude,
          longitude: geo.longitude,
          sharedLeadPriceCentsSnapshot: sharedPrice,
          exclusiveLeadPriceCentsSnapshot: exclusivePrice,
          currentRadiusKm: initialRadius,
          expiresAt,
        },
        select: { id: true },
      });

      return lead.id;
    });
    leadId = result;
  } catch (err) {
    console.error("[createLead] DB failure", err);
    return {
      success: false,
      code: "INTERNAL",
      message: "Une erreur interne est survenue. Réessayez dans un instant.",
    };
  }

  // ─── Matching stub (S2 fera le vrai travail) ────────────────
  try {
    await matchLead(leadId);
  } catch (err) {
    console.error("[createLead] matching stub error", err);
  }

  // ─── Email "Demande reçue" ──────────────────────────────────
  await sendLeadReceivedEmail({
    to: input.email,
    firstName: input.firstName,
    categoryName: subCategory.category.name,
  });

  return { success: true, leadId };
}
