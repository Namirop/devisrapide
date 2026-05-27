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

export type NewLeadProProps = {
  clientFirstName: string;
  clientLastNameInitial: string;
  categoryName: string;
  subCategoryName: string;
  urgencyLabel: string;
  postalCode: string;
  city: string;
  priceCents: number;
  assignmentUrl: string;
};

/**
 * Email envoye au pro a la creation d'une LeadAssignment PENDING.
 * Coordonnees client volontairement masquees : prenom + initiale du nom,
 * pas de telephone/email/adresse. Ces donnees sensibles sont devoilees
 * apres acceptation (cf. LeadAcceptedPro).
 */
export function NewLeadPro({
  clientFirstName,
  clientLastNameInitial,
  categoryName,
  subCategoryName,
  urgencyLabel,
  postalCode,
  city,
  priceCents,
  assignmentUrl,
}: NewLeadProProps) {
  const priceEur = (priceCents / 100).toFixed(2).replace(".", ",");
  return (
    <Html lang="fr">
      <Head />
      <Preview>Nouveau lead disponible — {categoryName}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading as="h1" style={h1}>
            Nouveau lead disponible
          </Heading>
          <Text style={text}>
            Un client recherche un artisan pour&nbsp;: <strong>{categoryName}</strong> — {subCategoryName}.
          </Text>

          <Section style={card}>
            <Row label="Client" value={`${clientFirstName} ${clientLastNameInitial}.`} />
            <Row label="Urgence" value={urgencyLabel} />
            <Row label="Localisation" value={`${postalCode} ${city}`} />
            <Row label="Prix du lead" value={`${priceEur} €`} />
          </Section>

          <Text style={text}>
            Acceptez ce lead pour obtenir les coordonnées complètes du
            client et le contacter.
          </Text>

          <Section style={ctaWrap}>
            <Button href={assignmentUrl} style={cta}>
              Voir le lead
            </Button>
          </Section>

          <Text style={footer}>
            Téléphone et email du client disponibles après acceptation.
          </Text>
          <Text style={footer}>L&apos;équipe DevisRapide</Text>
        </Container>
      </Body>
    </Html>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={rowText}>
      <span style={rowLabel}>{label}&nbsp;:</span> <strong>{value}</strong>
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

const h1 = {
  color: "#1e3a8a",
  fontSize: "22px",
  fontWeight: 700,
  marginBottom: "16px",
};

const text = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "22px",
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

const ctaWrap = {
  textAlign: "center" as const,
  margin: "28px 0 16px",
};

const cta = {
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
};

export default NewLeadPro;
