import { Button, Heading, Section, Text } from "@react-email/components";

import { EmailFacts, type Fact } from "@/lib/email/components/EmailFacts";
import { EmailLayout } from "@/lib/email/components/EmailLayout";
import {
  colors,
  ctaPrimary,
  ctaWrap,
  heading,
  lead,
  link,
  note,
  signoff,
} from "@/lib/email/components/theme";
import { formatDateTimeBE } from "@/lib/date";
import { formatPriceCents } from "@/lib/stats";

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
 * checkout.session.completed traite avec succes). Fait aussi office de
 * justificatif : montant, bonus, nouveau solde, reference Stripe et date
 * sont presentes comme un recu, pour la reconciliation comptable.
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
  const amountLabel = formatPriceCents(amountCreditedCents);
  const dateLabel = formatDateTimeBE(transactionDate, {
    dateStyle: "long",
    timeStyle: "short",
  });

  const facts: Fact[] = [
    { label: "Pack", value: packLabel },
    {
      label: "Montant crédité",
      value: `+${amountLabel}`,
      tone: "success",
    },
  ];
  if (bonusCents > 0) {
    facts.push({
      label: "Dont bonus offert",
      value: `+${formatPriceCents(bonusCents)}`,
      tone: "success",
    });
  }
  facts.push(
    { label: "Nouveau solde", value: formatPriceCents(newBalanceCents) },
    { label: "Date", value: dateLabel, tone: "muted" },
    { label: "Référence Stripe", value: stripePaymentIntentId, tone: "muted" },
  );

  return (
    <EmailLayout preview={`Recharge confirmée — ${amountLabel} sur votre wallet`}>
      <Heading as="h1" style={heading}>
        Recharge confirmée
      </Heading>
      <Text style={lead}>
        Bonjour {companyName}, votre wallet a été crédité de{" "}
        <span style={amount}>{amountLabel}</span>. Merci pour votre confiance.
      </Text>

      <EmailFacts items={facts} />

      <Section style={ctaWrap}>
        <Button href={walletUrl} style={ctaPrimary}>
          Voir mon wallet
        </Button>
      </Section>

      <Text style={note}>
        Conservez la référence Stripe pour votre comptabilité ou en cas de
        litige. Une question&nbsp;?{" "}
        <a href="mailto:contact@devisrapide.be" style={link}>
          contact@devisrapide.be
        </a>
      </Text>
      <Text style={signoff}>L&apos;équipe DevisRapide</Text>
    </EmailLayout>
  );
}

// Vert = etat reel (credit effectif), pas decoration.
const amount = {
  color: colors.success,
  fontWeight: 600,
  fontVariantNumeric: "tabular-nums" as const,
};

export default RechargeConfirmation;
