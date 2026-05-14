import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type ProReactivatedProps = {
  companyName: string;
  dashboardUrl: string;
};

/**
 * Email "Compte réactivé". Envoyé après reactivateProProfile.
 * Le pro va à nouveau recevoir des leads selon ses critères.
 */
export function ProReactivated({
  companyName,
  dashboardUrl,
}: ProReactivatedProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Votre compte DevisRapide a été réactivé</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>COMPTE RÉACTIVÉ</Text>
          <Heading as="h1" style={h1}>
            Bienvenue de retour
          </Heading>
          <Text style={text}>
            Bonjour {companyName}, votre compte DevisRapide a été réactivé.
            Vous allez à nouveau recevoir les leads correspondant à vos
            critères (catégories, zone d&apos;intervention).
          </Text>

          <Section style={ctaWrap}>
            <a href={dashboardUrl} style={ctaPrimary}>
              Accéder à mon dashboard
            </a>
          </Section>

          <Text style={footer}>
            Une question ?{" "}
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
  color: "#16a34a",
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
const ctaWrap = { textAlign: "center" as const, margin: "24px 0 12px" };
const ctaPrimary = {
  backgroundColor: "#ea580c",
  color: "#ffffff",
  fontSize: "14.5px",
  fontWeight: 600,
  textDecoration: "none",
  borderRadius: "6px",
  padding: "11px 22px",
  display: "inline-block",
};
const footer = {
  color: "#6b7280",
  fontSize: "13px",
  marginTop: "16px",
  lineHeight: "20px",
};
const link = { color: "#1e3a8a", textDecoration: "underline" };

export default ProReactivated;
