import { type ReactElement } from "react";

import { render } from "@react-email/components";

import { getFromAddress, getResend } from "@/lib/email/client";
import {
  LeadAcceptedPro,
  type LeadAcceptedProProps,
} from "@/lib/email/templates/LeadAcceptedPro";
import {
  LeadReceivedClient,
  type LeadReceivedClientProps,
} from "@/lib/email/templates/LeadReceivedClient";
import {
  NewLeadPro,
  type NewLeadProProps,
} from "@/lib/email/templates/NewLeadPro";

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
}): Promise<void> {
  const { to, subject, element, label } = input;
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
      console.error(`[email/${label}] Resend error`, result.error);
    }
  } catch (err) {
    console.error(`[email/${label}] failed`, err);
  }
}
