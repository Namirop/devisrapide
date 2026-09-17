import { afterResponse } from "@/lib/after-response";
import { buildWalletUrl } from "@/lib/email/helpers";
import { sendLowBalanceEmail } from "@/lib/email/sender";
import { sendPushToProfile } from "@/lib/push/send";
import { WALLET_LOW_BALANCE_THRESHOLD_CENTS } from "@/lib/wallet/debit";

/**
 * Notifications communes aux deux chemins d'achat d'un lead : achat manuel
 * (`acceptLeadAssignment`) et auto-accept (`assignLeadToPros`). Un seul
 * exemplaire garde les deux chemins alignés.
 *
 * Envoi via `afterResponse` : un échec ne remonte jamais dans une transaction
 * d'achat déjà commitée, et un `void` nu serait coupé au gel de l'instance.
 */

/**
 * Prévient les pros encore en lice que le lead est parti. Wording identique
 * quel que soit le chemin : le pro ne peut pas déduire comment il a été acheté.
 */
export function notifyLeadNoLongerAvailable(input: {
  proProfileIds: ReadonlyArray<string>;
  leadId: string;
  city: string;
}): void {
  for (const proProfileId of input.proProfileIds) {
    afterResponse("push/leadNoLongerAvailable", () =>
      sendPushToProfile(proProfileId, {
        title: "Lead plus disponible",
        body: `Le lead à ${input.city} n'est plus disponible. D'autres demandes arrivent régulièrement dans votre zone, restez à l'affût !`,
        url: "/dashboard/leads",
        tag: `lead-taken-${input.leadId}`,
      }),
    );
  }
}

/**
 * Alerte solde bas (push + email opt-in), uniquement au franchissement du
 * seuil : sinon le pro recevrait la même alerte à chaque achat.
 */
export function notifyLowBalanceIfCrossed(input: {
  proProfileId: string;
  proEmail: string | undefined;
  notifyByEmail: boolean;
  companyName: string;
  balanceBeforeCents: number;
  balanceAfterCents: number;
}): void {
  const { balanceBeforeCents, balanceAfterCents } = input;
  const crossed =
    balanceBeforeCents >= WALLET_LOW_BALANCE_THRESHOLD_CENTS &&
    balanceAfterCents < WALLET_LOW_BALANCE_THRESHOLD_CENTS;
  if (!crossed) return;

  afterResponse("push/lowBalance", () =>
    sendPushToProfile(input.proProfileId, {
      title: "⚠️ Attention : solde bientôt vide",
      body: `Il ne vous reste que ${Math.round(balanceAfterCents / 100)}€ de crédits. Rechargez pour ne pas rater les prochains chantiers.`,
      url: "/dashboard/wallet",
      tag: `wallet-low-${input.proProfileId}`,
    }),
  );

  const proEmail = input.proEmail;
  if (proEmail) {
    afterResponse("email/lowBalance", () =>
      sendLowBalanceEmail({
        to: proEmail,
        notifyByEmail: input.notifyByEmail,
        companyName: input.companyName,
        balanceCents: balanceAfterCents,
        walletUrl: buildWalletUrl(),
      }),
    );
  }
}
