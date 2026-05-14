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

export type ProRejectedProps = {
  companyName: string;
  reason: string;
};

/**
 * Email "Candidature refusée". Envoyé après rejectProProfile. Inclut
 * la raison saisie par l'admin pour transparence. Etat terminal V1.
 */
export function ProRejected({ companyName, reason }: ProRejectedProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Votre candidature n&apos;a pas été retenue</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>CANDIDATURE NON RETENUE</Text>
          <Heading as="h1" style={h1}>
            Nous ne pourrons pas donner suite
          </Heading>
          <Text style={text}>
            Bonjour {companyName}, après examen, votre candidature
            n&apos;a pas été retenue pour rejoindre la plateforme
            DevisRapide.
          </Text>

          <Section style={card}>
            <Text style={textBold}>Raison communiquée :</Text>
            <Text style={text}>{reason}</Text>
          </Section>

          <Text style={text}>
            Si vous souhaitez contester cette décision ou clarifier la
            situation, n&apos;hésitez pas à nous écrire.
          </Text>

          <Text style={footer}>
            Contactez{" "}
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
  color: "#64748b",
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
const textBold = { ...text, fontWeight: 600, color: "#1e3a8a", marginBottom: 8 };
const card = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "6px",
  padding: "16px 20px",
  margin: "20px 0",
};
const footer = {
  color: "#6b7280",
  fontSize: "13px",
  marginTop: "16px",
  lineHeight: "20px",
};
const link = { color: "#1e3a8a", textDecoration: "underline" };

export default ProRejected;
