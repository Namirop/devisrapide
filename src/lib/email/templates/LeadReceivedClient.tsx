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

export type LeadReceivedClientProps = {
  firstName: string;
  categoryName: string;
};

export function LeadReceivedClient({
  firstName,
  categoryName,
}: LeadReceivedClientProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Votre demande de devis a bien été reçue</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading as="h1" style={h1}>
            Bonjour {firstName},
          </Heading>
          <Section>
            <Text style={text}>
              Nous avons bien reçu votre demande de devis pour&nbsp;:{" "}
              <strong>{categoryName}</strong>.
            </Text>
            <Text style={text}>
              Nous recherchons actuellement les artisans les plus pertinents
              dans votre zone. Vous serez recontacté(e) dans les plus brefs
              délais par téléphone ou email.
            </Text>
            <Text style={text}>
              Si aucun pro n&apos;est disponible dans les 24h, nous vous le
              ferons savoir et vous proposerons des alternatives.
            </Text>
            <Text style={footer}>L&apos;équipe DevisRapide</Text>
          </Section>
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

const h1 = {
  color: "#111827",
  fontSize: "20px",
  fontWeight: 600,
  marginBottom: "16px",
};

const text = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "22px",
};

const footer = {
  color: "#6b7280",
  fontSize: "13px",
  marginTop: "24px",
};

export default LeadReceivedClient;
