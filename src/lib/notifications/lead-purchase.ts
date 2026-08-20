import { afterResponse } from "@/lib/after-response";
import { buildWalletUrl } from "@/lib/email/helpers";
import { sendLowBalanceEmail } from "@/lib/email/sender";
import { sendPushToProfile } from "@/lib/push/send";
import { WALLET_LOW_BALANCE_THRESHOLD_CENTS } from "@/lib/wallet/debit";

/**
 * Notifications communes aux DEUX chemins d'achat d'un lead :
 *   - `acceptLeadAssignment` : achat manuel depuis le dashboard pro
 *   - `assignLeadToPros`     : auto-accept au moment de l'assignation
 *
 * Elles vivaient dupliquees dans les deux fichiers, avec le meme wording
 * et les memes tags recopies a la main. C'est precisement cette forme —
 * une regle metier ecrite deux fois, a deux endroits — qui avait laisse
 * l'auto-accept oublier de fermer le lead alors que l'achat manuel le
 * faisait. Un seul exemplaire, donc, et les deux chemins l'appellent.
 *
 * Toutes partent hors du chemin bloquant, via `afterResponse` : un echec
 * de notification ne doit jamais remonter dans une transaction d'achat
 * deja committee, mais un `void` nu se ferait couper par le gel de
 * l'instance (cf. lib/after-response.ts).
 */

/**
 * Previent les pros qui etaient encore dans la course que le lead vient
 * de leur passer sous le nez.
 *
 * Wording volontairement identique quel que soit le chemin : le pro ne
 * doit pas pouvoir deduire si le lead est parti en auto-accept ou en
 * achat manuel.
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
 * Alerte le pro sur son solde, uniquement au FRANCHISSEMENT du seuil
 * (avant >= seuil ET apres < seuil) — pas a chaque debit en dessous, sans
 * quoi le pro recevrait la meme alerte a chaque achat.
 *
 * Push + email partent ensemble ; l'email respecte le master-switch
 * `notifyByEmail` via `deliver()`.
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
