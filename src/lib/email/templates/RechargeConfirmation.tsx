import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type RechargeConfirmationProps = {
  companyName: string;
  packLabel: string;
  amountCreditedCents: number;
  /**
   * Portion bonus du credit (0 si aucun bonus pour ce pack). Permet la
   * mention "Bonus inclus : +X€" du wording Kamel H quand pertinent.
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
    <Html lang="fr">
      <Head />
      <Preview>
        Recharge confirmée — +{amountEur} € sur votre wallet
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>RECHARGE CONFIRMÉE</Text>
          <Heading as="h1" style={h1}>
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
            <Row label="Montant crédité" value={`+${amountEur} €`} highlight />
            <Row label="Nouveau solde" value={`${balanceEur} €`} />
            <Hr style={hr} />
            <Row label="Date" value={dateLabel} />
            <Row label="Référence Stripe" value={stripePaymentIntentId} mono />
          </Section>

          <Section style={ctaWrap}>
            <Button href={walletUrl} style={ctaPrimary}>
              Voir mon wallet
            </Button>
          </Section>

          <Text style={footer}>
            Conservez la référence Stripe ci-dessus en cas de litige ou pour
            votre comptabilité. Pour toute question, contactez{" "}
            <a href="mailto:contact@devisrapide.be" style={link}>
              contact@devisrapide.be
            </a>
            .
          </Text>
          <Text style={footer}>L&apos;équipe DevisRapide</Text>
        </Container>
      </Body>
    </Html>
  );
}

function formatEur(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function Row({
  label,
  value,
  highlight,
  mono,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <Text style={rowText}>
      <span style={rowLabel}>{label}&nbsp;:</span>{" "}
      <strong
        style={{
          ...(highlight ? rowHighlight : {}),
          ...(mono ? rowMono : {}),
        }}
      >
        {value}
      </strong>
    </Text>
  );
}

const body = {
  backgroundColor: "#f5f5f5",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "32px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const eyebrow = {
  color: "#ea580c",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.16em",
  textTransform: "uppercase" as const,
  margin: "0 0 8px",
};

const h1 = {
  color: "#1e3a8a",
  fontSize: "22px",
  fontWeight: 700,
  margin: "0 0 16px",
};

const text = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "22px",
};

const textBonus = {
  color: "#16a34a",
  fontSize: "15px",
  lineHeight: "22px",
  margin: "4px 0",
};

const card = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "6px",
  padding: "16px 20px",
  margin: "20px 0",
};

const rowText = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "4px 0",
};

const rowLabel = {
  color: "#6b7280",
};

const rowHighlight = {
  color: "#16a34a",
  fontSize: "16px",
};

const rowMono = {
  fontFamily: "ui-monospace, 'SF Mono', Menlo, Monaco, monospace",
  fontSize: "12px",
  color: "#475569",
  fontWeight: 500,
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "12px 0",
};

const ctaWrap = {
  textAlign: "center" as const,
  margin: "24px 0 12px",
};

const ctaPrimary = {
  backgroundColor: "#ea580c",
  color: "#ffffff",
  fontWeight: 600,
  fontSize: "15px",
  padding: "12px 24px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
};

const footer = {
  color: "#6b7280",
  fontSize: "13px",
  marginTop: "16px",
  lineHeight: "20px",
};

const link = {
  color: "#1e3a8a",
  textDecoration: "underline",
};

export default RechargeConfirmation;
