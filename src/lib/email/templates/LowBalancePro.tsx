import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type LowBalanceProProps = {
  companyName: string;
  /** Solde actuel en cents post-debit (sous le seuil). */
  balanceCents: number;
  walletUrl: string;
};

/**
 * Email "Solde wallet bientot vide" (Kamel I). Envoye au franchissement
 * du seuil WALLET_LOW_BALANCE_THRESHOLD_CENTS apres un debit lead
 * (auto-accept ou acceptation manuelle). Pendant email du push I.
 *
 * Email opt-in : respecte ProProfile.notifyByEmail via deliver()
 * requiresOptIn. C'est une alerte marketing, pas compliance.
 */
export function LowBalancePro({
  companyName,
  balanceCents,
  walletUrl,
}: LowBalanceProProps) {
  const balanceEur = Math.round(balanceCents / 100);
  return (
    <Html lang="fr">
      <Head />
      <Preview>
        Attention : votre solde DevisRapide est bientôt vide
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>SOLDE FAIBLE</Text>
          <Heading as="h1" style={h1}>
            ⚠️ Attention : solde bientôt vide
          </Heading>
          <Text style={text}>
            Bonjour {companyName}, il ne vous reste que{" "}
            <strong>{balanceEur}&nbsp;€</strong> de crédits sur votre wallet
            DevisRapide.
          </Text>
          <Text style={text}>
            Rechargez maintenant pour ne pas rater les prochains chantiers
            disponibles dans votre zone.
          </Text>

          <Section style={ctaWrap}>
            <Button href={walletUrl} style={ctaPrimary}>
              Recharger maintenant
            </Button>
          </Section>

          <Text style={footer}>
            Vous pouvez gérer vos préférences de notifications depuis votre
            espace pro.
          </Text>
          <Text style={footer}>L&apos;équipe DevisRapide</Text>
        </Container>
      </Body>
    </Html>
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
  margin: "0 0 12px",
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

export default LowBalancePro;
