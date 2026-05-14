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

export type ProSuspendedProps = {
  companyName: string;
  reason: string;
};

/**
 * Email "Compte suspendu". Envoyé après suspendProProfile. Le pro perd
 * l'accès aux nouveaux leads jusqu'à reactivation manuelle.
 */
export function ProSuspended({ companyName, reason }: ProSuspendedProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Votre compte DevisRapide a été suspendu</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>COMPTE SUSPENDU</Text>
          <Heading as="h1" style={h1}>
            Accès temporairement suspendu
          </Heading>
          <Text style={text}>
            Bonjour {companyName}, votre accès à la plateforme DevisRapide
            a été suspendu par l&apos;administration. Vous ne recevrez plus
            de nouveaux leads jusqu&apos;à nouvel ordre.
          </Text>

          <Section style={card}>
            <Text style={textBold}>Raison de la suspension :</Text>
            <Text style={text}>{reason}</Text>
          </Section>

          <Text style={text}>
            Votre wallet et l&apos;historique de vos leads restent
            accessibles depuis votre dashboard. Contactez-nous pour
            discuter d&apos;une éventuelle réactivation.
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
  color: "#dc2626",
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
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
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

export default ProSuspended;
