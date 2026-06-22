import { Button, Heading, Hr, Section, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/components/EmailLayout";
import { EmailRow } from "@/lib/email/components/EmailRow";
import {
  card,
  colors,
  ctaPrimary,
  ctaWrap,
  eyebrow,
  heading,
  hr,
  link,
  note,
  signoff,
  text,
} from "@/lib/email/components/theme";

export type RechargeConfirmationProps = {
  companyName: string;
  packLabel: string;
  amountCreditedCents: number;
  /**
   * Portion bonus du credit (0 si aucun bonus pour ce pack). Permet la
   * mention "Bonus inclus : +X€" du wording quand pertinent.
   */
  bonusCents: number;
  newBalanceCents: number;
  stripePaymentIntentId: string;
  transactionDate: Date;
  walletUrl: string;
};

/**
 * Email envoye au pro apres recharge wallet reussie (webhook
 * checkout.session.completed traite avec succes). Resume :
 *  - Montant credite (avec bonus pack inclus)
 *  - Bonus offert (si applicable)
 *  - Nouveau solde post-recharge
 *  - PaymentIntent Stripe pour reconciliation comptable
 *  - Date de la transaction
 *  - CTA "Voir mon wallet" → /dashboard/wallet
 */
export function RechargeConfirmation({
  companyName,
  packLabel,
  amountCreditedCents,
  bonusCents,
  newBalanceCents,
  stripePaymentIntentId,
  transactionDate,
  walletUrl,
}: RechargeConfirmationProps) {
  const amountEur = formatEur(amountCreditedCents);
  const bonusEur = formatEur(bonusCents);
  const balanceEur = formatEur(newBalanceCents);
  const hasBonus = bonusCents > 0;
  const dateLabel = transactionDate.toLocaleString("fr-BE", {
    dateStyle: "long",
    timeStyle: "short",
  });
  return (
    <EmailLayout preview={`Recharge confirmée — +${amountEur} € sur votre wallet`}>
      <Text style={eyebrow}>RECHARGE CONFIRMÉE</Text>
      <Heading as="h1" style={heading}>
        Recharge confirmée
      </Heading>
      <Text style={text}>
        Bonjour {companyName}, votre wallet a été crédité de{" "}
        <strong>{amountEur} €</strong> ({packLabel}).
      </Text>
      {hasBonus && (
        <Text style={textBonus}>
          <strong>Bonus inclus&nbsp;: +{bonusEur} €</strong>
        </Text>
      )}
      <Text style={text}>Merci pour votre confiance.</Text>

      <Section style={card}>
        <EmailRow
          label="Montant crédité"
          value={`+${amountEur} €`}
          valueStyle={rowHighlight}
        />
        <EmailRow label="Nouveau solde" value={`${balanceEur} €`} />
        <Hr style={hr} />
        <EmailRow label="Date" value={dateLabel} />
        <EmailRow
          label="Référence Stripe"
          value={stripePaymentIntentId}
          valueStyle={rowMono}
        />
      </Section>

      <Section style={ctaWrap}>
        <Button href={walletUrl} style={ctaPrimary}>
          Voir mon wallet
        </Button>
      </Section>

      <Text style={note}>
        Conservez la référence Stripe ci-dessus en cas de litige ou pour votre
        comptabilité. Pour toute question, contactez{" "}
        <a href="mailto:contact@devisrapide.be" style={link}>
          contact@devisrapide.be
        </a>
        .
      </Text>
      <Text style={signoff}>L&apos;équipe DevisRapide</Text>
    </EmailLayout>
  );
}

function formatEur(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

const textBonus = {
  color: colors.success,
  fontSize: "15px",
  lineHeight: "23px",
  margin: "4px 0 12px",
};

const rowHighlight = {
  color: colors.success,
  fontSize: "16px",
};

const rowMono = {
  fontFamily: "ui-monospace, 'SF Mono', Menlo, Monaco, monospace",
  fontSize: "12px",
  color: "#475569",
  fontWeight: 500,
};

export default RechargeConfirmation;
