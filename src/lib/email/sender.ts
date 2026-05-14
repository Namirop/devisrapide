import { type ReactElement } from "react";

import { render } from "@react-email/components";

import { getFromAddress, getResend } from "@/lib/email/client";
import {
  LeadAcceptedPro,
  type LeadAcceptedProProps,
} from "@/lib/email/templates/LeadAcceptedPro";
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
  ProValidated,
  type ProValidatedProps,
} from "@/lib/email/templates/ProValidated";
import {
  RechargeConfirmation,
  type RechargeConfirmationProps,
} from "@/lib/email/templates/RechargeConfirmation";

type SendLeadReceivedArgs = LeadReceivedClientProps & {
  to: string;
};

/**
 * Envoie l'email "Demande reçue" au client.
 * Si RESEND_API_KEY est absent, log le contenu en console (dev local).
 * Pas de retry : l'email n'est pas critique pour le flow.
 */
export async function sendLeadReceivedEmail(
  args: SendLeadReceivedArgs,
): Promise<void> {
  const { to, firstName, categoryName } = args;
  await deliver({
    to,
    subject: "Votre demande de devis a bien été reçue",
    element: LeadReceivedClient({ firstName, categoryName }),
    label: "sendLeadReceivedEmail",
  });
}

/**
 * Envoie l'email "Nouveau lead disponible" au pro a la creation d'une
 * LeadAssignment PENDING. Coordonnees client masquees.
 */
export async function sendNewLeadProEmail(
  args: NewLeadProProps & { to: string },
): Promise<void> {
  const { to, ...props } = args;
  await deliver({
    to,
    subject: `Nouveau lead disponible — ${args.categoryName}`,
    element: NewLeadPro(props),
    label: "sendNewLeadProEmail",
  });
}

/**
 * Envoie l'email "Lead accepté — coordonnees client" au pro apres
 * acceptation (manuelle ou auto). Coordonnees completes.
 */
export async function sendLeadAcceptedProEmail(
  args: LeadAcceptedProProps & { to: string },
): Promise<void> {
  const { to, ...props } = args;
  await deliver({
    to,
    subject: `Lead accepté — coordonnées de ${args.clientFirstName} ${args.clientLastName}`,
    element: LeadAcceptedPro(props),
    label: "sendLeadAcceptedProEmail",
  });
}

/**
 * Envoie l'email "Wallet rechargé" au pro apres traitement reussi du
 * webhook checkout.session.completed. Trigger depuis le webhook handler
 * APRES la transaction Prisma de credit, fire-and-forget. Si Resend
 * echoue, on log avec contexte complet (proProfileId, packId, amount,
 * stripeEventId) pour debug "pro qui a paye mais n'a pas recu son email".
 */
export async function sendRechargeConfirmationEmail(
  args: RechargeConfirmationProps & {
    to: string;
    proProfileId: string;
    packId: string;
    stripeEventId: string;
  },
): Promise<void> {
  const { to, proProfileId, packId, stripeEventId, ...props } = args;
  await deliver({
    to,
    subject: "Wallet rechargé avec succès",
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

/**
 * Envoie l'email "Compte validé" au pro apres validateProProfile.
 * Fire-and-forget, log les erreurs avec contexte proProfileId.
 */
export async function sendProValidatedEmail(
  args: ProValidatedProps & { to: string; proProfileId: string },
): Promise<void> {
  const { to, proProfileId, ...props } = args;
  await deliver({
    to,
    subject: "Votre compte DevisRapide est validé",
    element: ProValidated(props),
    label: "sendProValidatedEmail",
    context: { proProfileId },
  });
}

/**
 * Envoie l'email "Candidature non retenue" au pro apres rejectProProfile.
 */
export async function sendProRejectedEmail(
  args: ProRejectedProps & { to: string; proProfileId: string },
): Promise<void> {
  const { to, proProfileId, ...props } = args;
  await deliver({
    to,
    subject: "Votre candidature DevisRapide n'a pas été retenue",
    element: ProRejected(props),
    label: "sendProRejectedEmail",
    context: { proProfileId },
  });
}

/**
 * Envoie l'email "Compte suspendu" au pro apres suspendProProfile.
 */
export async function sendProSuspendedEmail(
  args: ProSuspendedProps & { to: string; proProfileId: string },
): Promise<void> {
  const { to, proProfileId, ...props } = args;
  await deliver({
    to,
    subject: "Votre compte DevisRapide a été suspendu",
    element: ProSuspended(props),
    label: "sendProSuspendedEmail",
    context: { proProfileId },
  });
}

/**
 * Envoie l'email "Compte réactivé" au pro apres reactivateProProfile.
 */
export async function sendProReactivatedEmail(
  args: ProReactivatedProps & { to: string; proProfileId: string },
): Promise<void> {
  const { to, proProfileId, ...props } = args;
  await deliver({
    to,
    subject: "Votre compte DevisRapide a été réactivé",
    element: ProReactivated(props),
    label: "sendProReactivatedEmail",
    context: { proProfileId },
  });
}

/**
 * Envoie l'email "Lead offert" au pro apres assignLeadGratis. Variant
 * de LeadAcceptedPro : pas de prix, optionnel adminNote.
 */
export async function sendLeadGiftedProEmail(
  args: LeadGiftedProProps & {
    to: string;
    proProfileId: string;
    leadId: string;
  },
): Promise<void> {
  const { to, proProfileId, leadId, ...props } = args;
  await deliver({
    to,
    subject: `Lead offert — coordonnées de ${args.clientFirstName} ${args.clientLastName}`,
    element: LeadGiftedPro(props),
    label: "sendLeadGiftedProEmail",
    context: { proProfileId, leadId },
  });
}

// ─── Helper interne ─────────────────────────────────────────────
//
// Centralise le pattern fallback console + try/catch Resend pour eviter
// de dupliquer 3 fois la meme logique. Tous les emails de ce projet
// sont fire-and-forget : on log les erreurs, on ne re-throw pas, car
// l'echec d'email ne doit pas bloquer le flow metier.

async function deliver(input: {
  to: string;
  subject: string;
  element: ReactElement;
  label: string;
  /**
   * Contexte additionnel pour les logs d'erreur. Sert aux emails
   * sensibles comme RechargeConfirmation, ou un echec d'envoi doit
   * pouvoir etre relie a la transaction Stripe correspondante en
   * console.error (proProfileId, packId, amountCents, stripeEventId).
   */
  context?: Record<string, string | number | undefined>;
}): Promise<void> {
  const { to, subject, element, label, context } = input;
  const resend = getResend();
  if (!resend) {
    const text = await render(element, { plainText: true });
    console.warn(
      `[email] RESEND_API_KEY absent — fallback console.\n` +
        `[${label}] to=${to}\nsubject=${subject}\n${text}`,
    );
    return;
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
    }
  } catch (err) {
    console.error(`[email/${label}] failed`, {
      to,
      subject,
      error: err instanceof Error ? err.message : String(err),
      ...(context ?? {}),
    });
  }
}
