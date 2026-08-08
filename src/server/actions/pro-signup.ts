"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";

import { buildAdminProReviewUrl } from "@/lib/email/helpers";
import { sendNewProSignupAdminEmail } from "@/lib/email/sender";
import { validateAndResolvePostalCode } from "@/lib/geo/be-postal";
import { prisma } from "@/lib/prisma";
import { proSignupLimiter } from "@/lib/ratelimit";
import { verifyTurnstileToken } from "@/lib/turnstile/verify";
import { proSignupSchema } from "@/schemas/pro-signup";

// Server Action submitProRegistration : valide les 4 etapes du wizard
// inscription pro, cree le User (role PRO + passwordHash) + ProProfile
// (validationStatus PENDING). Retourne un resultat discriminated union.

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

// Etat d'un email vis a vis de l'inscription pro.
//
// "shell" est le cas non evident : demander un devis cree un User CLIENT sans
// mot de passe (cf. l'upsert de createLead) juste pour rattacher le lead. Ce
// n'est pas un compte — personne ne peut s'y connecter. Le traiter comme
// "email pris" interdisait a un particulier ayant deja demande un devis de
// devenir pro, ce qui est un usage legitime et frequent.
type EmailOwnership =
  | { kind: "free" }
  | { kind: "shell"; userId: string }
  | { kind: "taken" };

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

  // Un compte supprime (RGPD) garde son email : on ne le recycle pas.
  const isShell =
    existing.role === "CLIENT" &&
    existing.passwordHash === null &&
    existing.proProfile === null &&
    existing.deletedAt === null;

  return isShell ? { kind: "shell", userId: existing.id } : { kind: "taken" };
}

// Pre-check d'unicite email + VAT, appele depuis le wizard a la transition
// step 1 -> 2 pour ne pas laisser l'utilisateur remplir 3 etapes avant de
// se prendre l'erreur EMAIL_TAKEN / VAT_TAKEN au submit final.
//
// Pas de rate-limit serveur ici : la verification finale dans
// submitProRegistration reste autoritaire et passe par proSignupLimiter.
// On accepte que ce check soit appelable plus librement (pas d'info
// sensible exposee : l'utilisateur sait deja si SON email/VAT est pris
// puisqu'il vient de le taper).
export async function checkProSignupIdentity(input: {
  email: string;
  vatNumber: string;
}): Promise<{
  ok: boolean;
  fieldErrors?: { email?: string; vatNumber?: string };
}> {
  const email = input.email.toLowerCase().trim();
  const vatNumber = input.vatNumber.trim();
  if (!email || !vatNumber) return { ok: true };

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

  // Rate limit IP : 3 inscriptions / heure. Anti-spam pour eviter de
  // polluer la file d'attente admin /admin/professionnels.
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

  // Turnstile anti-bot. Verify apres rate limit pour ne pas consommer
  // de quota Cloudflare sur les IPs deja bloquees.
  const turnstileResult = await verifyTurnstileToken(input.turnstileToken, ip);
  if (!turnstileResult.success) {
    return {
      success: false,
      code: "TURNSTILE_FAILED",
      message:
        "Vérification de sécurité échouée. Rechargez la page et réessayez.",
    };
  }

  // Unicite email + vatNumber (cote DB la contrainte @unique tomberait, mais
  // on prefere un message clair avant de tenter le insert).
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
      // Coquille CLIENT laissee par une demande de devis : on la promeut en
      // compte PRO au lieu d'en creer un second. L'historique des demandes
      // faites en tant que particulier reste rattache au meme User.
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

    // Alerte l'equipe : un pro en PENDING ne recoit aucun lead tant que
    // personne ne l'a valide, et jusqu'ici rien ne signalait son arrivee
    // (un console.info sur une fonction serverless que personne ne lit).
    // Fire-and-forget : une candidature enregistree ne doit pas echouer
    // parce que Resend est indisponible.
    void notifyAdminsOfNewPro({
      proProfileId: result.proProfileId,
      companyName: input.companyName,
      contactName: `${input.firstName} ${input.lastName}`,
      email: input.email,
      phone: input.phone,
      vatNumber: input.vatNumber ?? null,
      city: geo.commune,
      postalCode: input.zonePostalCode,
      categoryIds: input.categoryIds,
    }).catch(() => {});

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
 * Previent les administrateurs qu'une candidature attend leur validation.
 *
 * Destinataires resolus en base (role ADMIN, non supprime) plutot que via
 * une variable d'environnement : l'adresse de l'admin a deja change une
 * fois, et une liste figee dans la config se serait perimee en silence.
 *
 * Les noms de metiers sont resolus ici et pas dans le wizard : l'action ne
 * recoit que des categoryIds.
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
