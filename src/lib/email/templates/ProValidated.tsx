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

export type ProValidatedProps = {
  companyName: string;
  dashboardUrl: string;
};

/**
 * Email "Compte pro validé". Envoyé après validateProProfile par
 * l'admin. Le pro peut désormais accéder à son dashboard et recevoir
 * des leads.
 */
export function ProValidated({ companyName, dashboardUrl }: ProValidatedProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Votre compte DevisRapide est validé</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>VALIDATION CONFIRMÉE</Text>
          <Heading as="h1" style={h1}>
            Bienvenue sur DevisRapide
          </Heading>
          <Text style={text}>
            Bonjour {companyName}, votre candidature a été validée par notre
            équipe. Vous pouvez dès maintenant accéder à votre espace
            professionnel et commencer à recevoir des demandes de devis.
          </Text>

          <Section style={card}>
            <Text style={textBold}>Prochaines étapes :</Text>
            <Text style={text}>
              1. Complétez votre profil (photo, description, métiers).
            </Text>
            <Text style={text}>
              2. Rechargez votre wallet pour acheter vos premiers leads.
            </Text>
            <Text style={text}>
              3. Activez Auto-accept pour ne rater aucune opportunité.
            </Text>
          </Section>

          <Section style={ctaWrap}>
            <Button href={dashboardUrl} style={ctaPrimary}>
              Accéder à mon dashboard
            </Button>
          </Section>

          <Text style={footer}>
            Une question&nbsp;? Contactez{" "}
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
  margin: "0 0 6px",
};
const textBold = { ...text, fontWeight: 600, color: "#1e3a8a", marginBottom: 12 };
const card = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "6px",
  padding: "16px 20px",
  margin: "20px 0",
};
const ctaWrap = { textAlign: "center" as const, margin: "24px 0 12px" };
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
const link = { color: "#1e3a8a", textDecoration: "underline" };

export default ProValidated;
