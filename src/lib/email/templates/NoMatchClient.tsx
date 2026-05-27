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

export type NoMatchClientProps = {
  firstName: string;
  city: string;
};

/**
 * Email "Point sur votre demande" (Kamel B). Envoye au client par le
 * cron check-no-match-leads quand aucun pro n'a accepte sous 24h+ et
 * que la demande n'a pas encore recu de follow-up.
 *
 * Ton rassurant, pas alarmiste : "nos artisans sont sollicites, on
 * cherche". Une seule occurrence par lead (Lead.noMatchNotifiedAt).
 *
 * Pas de toggle email (le client n'a pas de compte, donc pas de
 * preferences notifications).
 */
export function NoMatchClient({ firstName, city }: NoMatchClientProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Point sur votre demande à {city}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading as="h1" style={h1}>
            Bonjour {firstName},
          </Heading>
          <Section>
            <Text style={text}>
              Nos artisans partenaires sont actuellement très sollicités dans
              votre région.
            </Text>
            <Text style={text}>
              Nous continuons nos recherches activement. Si aucune
              disponibilité ne se libère d&apos;ici 48h, nous vous en
              informerons immédiatement.
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
  margin: "0 0 12px",
};

const footer = {
  color: "#6b7280",
  fontSize: "13px",
  marginTop: "24px",
};

export default NoMatchClient;
