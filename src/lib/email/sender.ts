import { render } from "@react-email/components";

import { getFromAddress, getResend } from "@/lib/email/client";
import {
  LeadReceivedClient,
  type LeadReceivedClientProps,
} from "@/lib/email/templates/LeadReceivedClient";

type SendLeadReceivedArgs = LeadReceivedClientProps & {
  to: string;
};

/**
 * Envoie l'email "Demande reçue" au client.
 * Si RESEND_API_KEY est absent, log le contenu en console (dev local).
 * Pas de retry au S1 : l'email n'est pas critique pour le flow.
 */
export async function sendLeadReceivedEmail(
  args: SendLeadReceivedArgs,
): Promise<void> {
  const { to, firstName, categoryName } = args;
  const subject = "Votre demande de devis a bien été reçue";
  const element = LeadReceivedClient({ firstName, categoryName });

  const resend = getResend();
  if (!resend) {
    const text = await render(element, { plainText: true });
    console.warn(
      `[email] RESEND_API_KEY absent — fallback console.\n` +
        `to=${to}\nsubject=${subject}\n${text}`,
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
      console.error("[email] Resend error", result.error);
    }
  } catch (err) {
    console.error("[email] sendLeadReceivedEmail failed", err);
  }
}
