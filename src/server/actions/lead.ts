"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { getAppConfig } from "@/lib/config";
import { sendLeadReceivedEmail } from "@/lib/email/sender";
import { geocodePostalCode, isGeocodeError } from "@/lib/geo/be-postal";
import { isLeadCreationEnabled } from "@/lib/lead-creation-switch";
import { matchLead } from "@/lib/matching";
import { computeLeadBasePrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { enforceCreateLeadRateLimits } from "@/lib/ratelimit";
import { verifyTurnstileToken } from "@/lib/turnstile/verify";
import { createLeadSchema } from "@/schemas/lead";

export type CreateLeadResult =
  | { success: true; leadId: string }
  | {
      success: false;
      code:
        | "INVALID_INPUT"
        | "RATE_LIMITED"
        | "TURNSTILE_FAILED"
        | "INVALID_POSTAL_CODE"
        | "SUBCATEGORY_NOT_FOUND"
        | "SERVICE_DISABLED"
        | "INTERNAL";
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export async function createLead(
  rawInput: unknown,
): Promise<CreateLeadResult> {
  // ─── Kill switch ────────────────────────────────────────────
  // Si l'admin a suspendu la création de demandes (spam / incident), on
  // refuse avant tout traitement. La page /demande masque déjà le
  // formulaire ; ce garde-fou couvre les appels directs et les formulaires
  // ouverts avant la coupure. Lecture sans cache (propagation instantanée).
  if (!(await isLeadCreationEnabled())) {
    return {
      success: false,
      code: "SERVICE_DISABLED",
      message:
        "Le service est temporairement indisponible. Nous reprenons les demandes très bientôt.",
    };
  }

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

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";

  // ─── Turnstile (anti-bot) ───────────────────────────────────
  // Vérifié AVANT le rate limit : un bot sans jeton valide est rejeté
  // sans consommer le quota email/téléphone/IP du visiteur légitime
  // dont il usurperait les coordonnées. Même ordre que le login.
  const turnstile = await verifyTurnstileToken(input.turnstileToken, ip);
  if (!turnstile.success) {
    return {
      success: false,
      code: "TURNSTILE_FAILED",
      message:
        "La vérification de sécurité a échoué. Rechargez la page et réessayez.",
    };
  }

  // ─── Anti-spam multi-dimensions (email / téléphone / IP) ────
  // En plus de l'IP, throttle par email + téléphone normalisé
  // pour bloquer les faux leads en série depuis un même contact.
  const rl = await enforceCreateLeadRateLimits({
    ip,
    email: input.email,
    phone: input.phone,
  });
  if (!rl.ok) {
    // Message générique volontaire : ne pas révéler quelle dimension est
    // dépassée (email / téléphone / IP) pour ne pas guider les fraudeurs.
    // Le blocage est déjà loggé dans enforceCreateLeadRateLimits.
    return {
      success: false,
      code: "RATE_LIMITED",
      message:
        "Nous ne pouvons pas traiter votre demande pour le moment. Veuillez réessayer plus tard.",
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
  const baseSharedPrice =
    subCategory.sharedLeadPriceCents ??
    subCategory.category.defaultSharedLeadPriceCents;
  const baseExclusivePrice =
    subCategory.exclusiveLeadPriceCents ??
    subCategory.category.defaultExclusiveLeadPriceCents;
  // Application du modulateur d'urgence aux 2 snapshots de prix.
  const { sharedCents: sharedPrice, exclusiveCents: exclusivePrice } =
    computeLeadBasePrice({
      sharedPriceCents: baseSharedPrice,
      exclusivePriceCents: baseExclusivePrice,
      urgency: input.urgency,
    });

  // ─── Géocodage BE (JSON statique, pas de réseau) ────────────
  let geo;
  try {
    geo = await geocodePostalCode(input.postalCode);
  } catch (err) {
    if (isGeocodeError(err)) {
      return {
        success: false,
        code: "INVALID_POSTAL_CODE",
        message: "Code postal introuvable.",
        fieldErrors: { postalCode: ["Code postal introuvable"] },
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
  // RADIUS_PALIERS_KM (BE) = [30, 60, -1]. -1 = OPEN (toute la zone V1).
  // Le palier 0 (initialRadius) doit etre une valeur positive en km. Si la
  // config est absente ou cassee, fallback 30 (= cible BE par defaut).
  const radiusPaliers = await getAppConfig("RADIUS_PALIERS_KM", "json");
  const initialRadius = Array.isArray(radiusPaliers)
    ? Number(radiusPaliers[0]) || 30
    : 30;
  const timeoutHours = await getAppConfig("LEAD_GLOBAL_TIMEOUT_HOURS", "int");
  const expiresAt = new Date(Date.now() + timeoutHours * 60 * 60 * 1000);

  // ─── Upsert User CLIENT + Create Lead (transaction) ─────────
  let leadId: string;
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Un pro (ou un admin) peut demander un devis pour lui-meme avec
      // l'email de son compte. On rattache alors le lead a son User sans
      // toucher a ses coordonnees de compte — le Lead porte deja son propre
      // snapshot nom/prenom/telephone juste en dessous.
      const existingUser = await tx.user.findUnique({
        where: { email: input.email },
        select: { id: true, role: true },
      });
      const user = existingUser
        ? existingUser.role === "CLIENT"
          ? await tx.user.update({
              where: { id: existingUser.id },
              data: {
                firstName: input.firstName,
                lastName: input.lastName,
                phone: input.phone,
              },
              select: { id: true },
            })
          : existingUser
        : await tx.user.create({
            data: {
              email: input.email,
              role: "CLIENT",
              firstName: input.firstName,
              lastName: input.lastName,
              phone: input.phone,
            },
            select: { id: true },
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
    Sentry.captureException(err, {
      tags: { area: "lead", phase: "db-transaction" },
    });
    return {
      success: false,
      code: "INTERNAL",
      message: "Une erreur interne est survenue. Réessayez dans un instant.",
    };
  }

  // ─── Matching ────────────────────────────────────────────────
  // Best-effort : si le matching plante, le lead reste PENDING_MATCH
  // et sera ramasse au prochain cron run. On capture l'exception
  // dans Sentry pour visibilite (pas de retry user-driven).
  try {
    await matchLead(leadId);
  } catch (err) {
    console.error("[createLead] matching error", err);
    Sentry.captureException(err, {
      tags: { area: "lead", phase: "initial-match" },
      extra: { leadId },
    });
  }

  // ─── Email "Demande reçue" ──────────────────────────────────
  await sendLeadReceivedEmail({
    to: input.email,
    firstName: input.firstName,
    categoryName: subCategory.category.name,
    subCategoryName: subCategory.name,
    city: geo.city,
  });

  // Revalidation cote admin : le nouveau lead doit apparaitre dans
  // /admin (home) et /admin/leads sans attendre le revalidate timeout.
  revalidatePath("/admin");
  revalidatePath("/admin/leads");

  return { success: true, leadId };
}
