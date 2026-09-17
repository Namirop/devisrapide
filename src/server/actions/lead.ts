"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { reportIncident } from "@/lib/alerting";
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
  // Kill switch, lu sans cache. /demande masque déjà le formulaire : ce
  // contrôle couvre les appels directs et les formulaires ouverts avant.
  if (!(await isLeadCreationEnabled())) {
    return {
      success: false,
      code: "SERVICE_DISABLED",
      message:
        "Le service est temporairement indisponible. Nous reprenons les demandes très bientôt.",
    };
  }

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

  // Turnstile avant le rate limit (comme au login) : un bot sans jeton ne
  // consomme pas le quota du visiteur dont il usurpe les coordonnées.
  const turnstile = await verifyTurnstileToken(input.turnstileToken, ip);
  if (!turnstile.success) {
    return {
      success: false,
      code: "TURNSTILE_FAILED",
      message:
        "La vérification de sécurité a échoué. Rechargez la page et réessayez.",
    };
  }

  // Limites par IP, email et téléphone : bloque les faux leads en série.
  const rl = await enforceCreateLeadRateLimits({
    ip,
    email: input.email,
    phone: input.phone,
  });
  if (!rl.ok) {
    // Message volontairement générique : ne pas révéler la limite atteinte.
    // Le blocage est journalisé par enforceCreateLeadRateLimits.
    return {
      success: false,
      code: "RATE_LIMITED",
      message:
        "Nous ne pouvons pas traiter votre demande pour le moment. Veuillez réessayer plus tard.",
    };
  }

  // Prix courants, figés en snapshot sur le lead (modulés par l'urgence).
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
  const { sharedCents: sharedPrice, exclusiveCents: exclusivePrice } =
    computeLeadBasePrice({
      sharedPriceCents: baseSharedPrice,
      exclusivePriceCents: baseExclusivePrice,
      urgency: input.urgency,
    });

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

  // Rayon initial = premier palier de RADIUS_PALIERS_KM (défaut [30, 60, -1]),
  // repli à 30 km si la valeur est invalide.
  const radiusPaliers = await getAppConfig("RADIUS_PALIERS_KM", "json");
  const initialRadius = Array.isArray(radiusPaliers)
    ? Number(radiusPaliers[0]) || 30
    : 30;
  const timeoutHours = await getAppConfig("LEAD_GLOBAL_TIMEOUT_HOURS", "int");
  const expiresAt = new Date(Date.now() + timeoutHours * 60 * 60 * 1000);

  let leadId: string;
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Un pro ou un admin peut demander un devis avec l'email de son compte :
      // le lead lui est rattaché sans modifier son compte, puisque le Lead
      // porte son propre snapshot de coordonnées.
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
    // Incident : sinon personne ne saurait que le client est reparti en erreur.
    await reportIncident("lead.create-failed", { error: err });
    return {
      success: false,
      code: "INTERNAL",
      message: "Une erreur interne est survenue. Réessayez dans un instant.",
    };
  }

  // Best-effort : un échec laisse le lead en PENDING_MATCH, repris par le cron
  // au palier suivant. Limite connue : si l'échec précède l'écriture de
  // matchingStartedAt, le cron ne le reprend pas avant son expiration.
  try {
    await matchLead(leadId);
  } catch (err) {
    console.error("[createLead] matching error", {
      leadId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  await sendLeadReceivedEmail({
    to: input.email,
    firstName: input.firstName,
    categoryName: subCategory.category.name,
    subCategoryName: subCategory.name,
    city: geo.city,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/leads");

  return { success: true, leadId };
}
