import { type ReactElement } from "react";

import { render } from "@react-email/components";

import { reportIncident } from "@/lib/alerting";
import { getFromAddress, getResend } from "@/lib/email/client";
import { RESEND_FREE_DAILY_LIMIT, recordEmailsSent } from "@/lib/email/quota";
import {
  LeadAcceptedPro,
  type LeadAcceptedProProps,
} from "@/lib/email/templates/LeadAcceptedPro";
import {
  LowBalancePro,
  type LowBalanceProProps,
} from "@/lib/email/templates/LowBalancePro";
import {
  NoMatchClient,
  type NoMatchClientProps,
} from "@/lib/email/templates/NoMatchClient";
import {
  LeadGiftedPro,
  type LeadGiftedProProps,
} from "@/lib/email/templates/LeadGiftedPro";
import {
  LeadReceivedClient,
  type LeadReceivedClientProps,
} from "@/lib/email/templates/LeadReceivedClient";
import {
  NewLeadPro,
  type NewLeadProProps,
} from "@/lib/email/templates/NewLeadPro";
import {
  NewProSignupAdmin,
  type NewProSignupAdminProps,
} from "@/lib/email/templates/NewProSignupAdmin";
import {
  ProReactivated,
  type ProReactivatedProps,
} from "@/lib/email/templates/ProReactivated";
import {
  ProRejected,
  type ProRejectedProps,
} from "@/lib/email/templates/ProRejected";
import {
  ProSuspended,
  type ProSuspendedProps,
} from "@/lib/email/templates/ProSuspended";
import {
  PasswordResetPro,
  type PasswordResetProProps,
} from "@/lib/email/templates/PasswordResetPro";
import {
  ProValidated,
  type ProValidatedProps,
} from "@/lib/email/templates/ProValidated";
import { QuotaWarningAdmin } from "@/lib/email/templates/QuotaWarningAdmin";
import {
  RechargeConfirmation,
  type RechargeConfirmationProps,
} from "@/lib/email/templates/RechargeConfirmation";

type SendLeadReceivedArgs = LeadReceivedClientProps & {
  to: string;
};

/** Email « Demande reçue » au client. Pas de retry : non critique. */
export async function sendLeadReceivedEmail(
  args: SendLeadReceivedArgs,
): Promise<boolean> {
  const { to, firstName, categoryName, subCategoryName, city } = args;
  return deliver({
    to,
    subject: `✅ Demande confirmée : nous cherchons vos experts ${categoryName}`,
    element: LeadReceivedClient({
      firstName,
      categoryName,
      subCategoryName,
      city,
    }),
    label: "sendLeadReceivedEmail",
  });
}

/**
 * Email « Point sur votre demande » au client (cron check-no-match-leads),
 * quand aucun pro n'a accepté 24 h après le matching. Essentiel : le client
 * n'a pas de compte, donc pas de préférence d'envoi.
 */
export async function sendNoMatchClientEmail(
  args: NoMatchClientProps & { to: string },
): Promise<boolean> {
  const { to, ...props } = args;
  return deliver({
    to,
    subject: `ℹ️ Point sur votre demande à ${args.city}`,
    element: NoMatchClient(props),
    label: "sendNoMatchClientEmail",
  });
}

/**
 * Email « Nouveau lead disponible » (coordonnées masquées). Opt-in :
 * l'appelant fournit `notifyByEmail`, déjà chargé pour le matching, ce qui
 * évite une lecture BDD de plus.
 */
export async function sendNewLeadProEmail(
  args: NewLeadProProps & { to: string; notifyByEmail: boolean },
): Promise<boolean> {
  const { to, notifyByEmail, ...props } = args;
  return deliver({
    to,
    subject: `Nouveau lead disponible : ${args.categoryName} à ${args.city}`,
    element: NewLeadPro(props),
    label: "sendNewLeadProEmail",
    requiresOptIn: true,
    notifyByEmail,
  });
}

/**
 * Email « Lead accepté » avec les coordonnées complètes. Opt-in : le pro
 * retrouve de toute façon ces coordonnées dans son dashboard.
 */
export async function sendLeadAcceptedProEmail(
  args: LeadAcceptedProProps & { to: string; notifyByEmail: boolean },
): Promise<boolean> {
  const { to, notifyByEmail, ...props } = args;
  return deliver({
    to,
    subject: `✅ Lead accepté : coordonnées de ${args.clientFirstName}`,
    element: LeadAcceptedPro(props),
    label: "sendLeadAcceptedProEmail",
    requiresOptIn: true,
    notifyByEmail,
  });
}

/**
 * Email « Solde bientôt vide » au franchissement du seuil bas. Opt-in.
 * Envoyé avec le push équivalent depuis `lib/notifications/lead-purchase.ts`.
 */
export async function sendLowBalanceEmail(
  args: LowBalanceProProps & { to: string; notifyByEmail: boolean },
): Promise<boolean> {
  const { to, notifyByEmail, ...props } = args;
  return deliver({
    to,
    subject: "⚠️ Attention : votre solde DevisRapide est bientôt vide",
    element: LowBalancePro(props),
    label: "sendLowBalanceEmail",
    requiresOptIn: true,
    notifyByEmail,
  });
}

/**
 * Email « Recharge confirmée », envoyé par le webhook Stripe après la
 * transaction de crédit. Le contexte loggé en cas d'échec permet de relier
 * l'email manquant au paiement.
 */
export async function sendRechargeConfirmationEmail(
  args: RechargeConfirmationProps & {
    to: string;
    proProfileId: string;
    packId: string;
    stripeEventId: string;
  },
): Promise<boolean> {
  const { to, proProfileId, packId, stripeEventId, ...props } = args;
  const amountEur = (props.amountCreditedCents / 100)
    .toFixed(2)
    .replace(".", ",");
  return deliver({
    to,
    subject: `✅ Recharge confirmée : +${amountEur} € sur votre wallet`,
    element: RechargeConfirmation(props),
    label: "sendRechargeConfirmationEmail",
    context: {
      proProfileId,
      packId,
      amountCents: props.amountCreditedCents,
      stripeEventId,
    },
  });
}

export async function sendProValidatedEmail(
  args: ProValidatedProps & { to: string; proProfileId: string },
): Promise<boolean> {
  const { to, proProfileId, ...props } = args;
  return deliver({
    to,
    subject: "Votre compte DevisRapide est validé",
    element: ProValidated(props),
    label: "sendProValidatedEmail",
    context: { proProfileId },
  });
}

export async function sendProRejectedEmail(
  args: ProRejectedProps & { to: string; proProfileId: string },
): Promise<boolean> {
  const { to, proProfileId, ...props } = args;
  return deliver({
    to,
    subject: "Votre candidature DevisRapide n'a pas été retenue",
    element: ProRejected(props),
    label: "sendProRejectedEmail",
    context: { proProfileId },
  });
}

export async function sendProSuspendedEmail(
  args: ProSuspendedProps & { to: string; proProfileId: string },
): Promise<boolean> {
  const { to, proProfileId, ...props } = args;
  return deliver({
    to,
    subject: "Votre compte DevisRapide a été suspendu",
    element: ProSuspended(props),
    label: "sendProSuspendedEmail",
    context: { proProfileId },
  });
}

export async function sendProReactivatedEmail(
  args: ProReactivatedProps & { to: string; proProfileId: string },
): Promise<boolean> {
  const { to, proProfileId, ...props } = args;
  return deliver({
    to,
    subject: "Votre compte DevisRapide a été réactivé",
    element: ProReactivated(props),
    label: "sendProReactivatedEmail",
    context: { proProfileId },
  });
}

/** Email « Lead offert » : variante de LeadAcceptedPro sans prix. */
export async function sendLeadGiftedProEmail(
  args: LeadGiftedProProps & {
    to: string;
    proProfileId: string;
    leadId: string;
  },
): Promise<boolean> {
  const { to, proProfileId, leadId, ...props } = args;
  return deliver({
    to,
    subject: `Lead offert — coordonnées de ${args.clientFirstName} ${args.clientLastName}`,
    element: LeadGiftedPro(props),
    label: "sendLeadGiftedProEmail",
    context: { proProfileId, leadId },
  });
}

/**
 * Email interne « Nouvelle candidature pro » aux admins, en un seul envoi
 * (Resend accepte un tableau `to`). Essentiel, jamais filtré par opt-in.
 */
export async function sendNewProSignupAdminEmail(
  args: NewProSignupAdminProps & { to: string[]; proProfileId: string },
): Promise<boolean> {
  const { to, proProfileId, ...props } = args;
  if (to.length === 0) {
    console.error("[email/sendNewProSignupAdminEmail] aucun destinataire", {
      proProfileId,
    });
    return false;
  }
  return deliver({
    to,
    subject: `Nouvelle candidature pro : ${args.companyName}`,
    element: NewProSignupAdmin(props),
    label: "sendNewProSignupAdminEmail",
    context: { proProfileId },
  });
}

/**
 * Email de réinitialisation du mot de passe. Essentiel (sécurité) : jamais
 * filtré par `notifyByEmail`, un pro doit toujours pouvoir récupérer son accès.
 */
export async function sendPasswordResetProEmail(
  args: PasswordResetProProps & { to: string },
): Promise<boolean> {
  const { to, ...props } = args;
  return deliver({
    to,
    subject: "Réinitialisez votre mot de passe DevisRapide",
    element: PasswordResetPro(props),
    label: "sendPasswordResetProEmail",
  });
}

// ─── Helper interne ─────────────────────────────────────────────
//
// Les envois ne lèvent jamais d'exception : un email raté ne doit pas
// bloquer le flux métier. Le booléen sert aux appelants qui doivent savoir
// (le cron no-match ne marque le lead notifié qu'en cas de succès) :
//   true  = remis à Resend, ou volontairement non envoyé (opt-out, dev sans
//           clé API) : rien à rejouer ;
//   false = échec d'envoi, l'appelant peut réessayer.
//
// Opt-in : l'union discriminée impose `notifyByEmail` à la compilation dès
// que `requiresOptIn: true`. Les emails sans opt-in (compte, recharge, lead
// offert, sécurité, client) partent toujours.

type DeliverInputBase = {
  to: string | string[];
  subject: string;
  element: ReactElement;
  label: string;
  /** Contexte ajouté aux logs d'erreur (ex. identifiants Stripe). */
  context?: Record<string, string | number | undefined>;
};

type DeliverInput = DeliverInputBase &
  ({ requiresOptIn?: false } | { requiresOptIn: true; notifyByEmail: boolean });

async function deliver(input: DeliverInput): Promise<boolean> {
  // Opt-out : préférence utilisateur, pas une erreur, donc aucun log.
  if (input.requiresOptIn === true && input.notifyByEmail === false) {
    return true;
  }

  const { to, subject, element, label, context } = input;
  const resend = getResend();
  if (!resend) {
    const text = await render(element, { plainText: true });
    console.warn(
      `[email] RESEND_API_KEY absent — fallback console.\n` +
        `[${label}] to=${to}\nsubject=${subject}\n${text}`,
    );
    return true;
  }

  try {
    const html = await render(element);
    const result = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      html,
    });
    if (result.error) {
      console.error(`[email/${label}] Resend error`, {
        to,
        subject,
        error: result.error,
        ...(context ?? {}),
      });
      await reportEmailFailure(label, result.error.message);
      return false;
    }
    await noteEmailsSent(Array.isArray(to) ? to.length : 1);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email/${label}] failed`, {
      to,
      subject,
      error: message,
      ...(context ?? {}),
    });
    await reportEmailFailure(label, message);
    return false;
  }
}

/**
 * Panne silencieuse par nature (le site tourne, les pros ne reçoivent plus
 * rien) : l'alerte passe par un canal indépendant de Resend. Ni destinataire
 * ni sujet dans l'alerte, envoyée à un tiers ; le détail reste dans les logs.
 */
async function reportEmailFailure(
  label: string,
  message: string,
): Promise<void> {
  await reportIncident("email.send-failed", { context: { label, message } });
}

/**
 * Compte les destinataires (et non les appels) pour le plafond quotidien
 * Resend : surcompter avance l'alerte, ce qui est le bon sens d'erreur.
 * Jamais bloquant : l'email est déjà parti.
 */
async function noteEmailsSent(recipients: number): Promise<void> {
  try {
    const outcome = await recordEmailsSent(recipients);
    if (outcome?.crossedWarning) {
      await sendQuotaWarningEmail(outcome.total);
    }
  } catch (err) {
    console.error("[email/quota] comptage échoué", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Alerte à `ALERT_EMAIL` au franchissement du seuil. Elle passe par
 * `deliver()` et se compte elle-même, sans risque de boucle : le seuil ne
 * se franchit qu'une fois par jour.
 */
async function sendQuotaWarningEmail(sentToday: number): Promise<void> {
  const to = (process.env.ALERT_EMAIL ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  if (to.length === 0) return;

  await deliver({
    to,
    subject: `⚠️ Quota e-mails : ${sentToday}/${RESEND_FREE_DAILY_LIMIT} aujourd'hui`,
    element: QuotaWarningAdmin({
      sentToday,
      dailyLimit: RESEND_FREE_DAILY_LIMIT,
    }),
    label: "sendQuotaWarningEmail",
  });
}
