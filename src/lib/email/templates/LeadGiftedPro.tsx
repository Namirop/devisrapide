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

export type LeadGiftedProProps = {
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone: string;
  categoryName: string;
  subCategoryName: string;
  urgencyLabel: string;
  postalCode: string;
  city: string;
  address: string | null;
  description: string;
  adminNote: string | null;
};

/**
 * Email envoye au pro apres qu'un admin lui a OFFERT un lead via
 * /admin/leads/[id]. Variant de LeadAcceptedPro : pas de prix debite,
 * eyebrow special "Lead offert", optionnel adminNote.
 */
export function LeadGiftedPro({
  clientFirstName,
  clientLastName,
  clientEmail,
  clientPhone,
  categoryName,
  subCategoryName,
  urgencyLabel,
  postalCode,
  city,
  address,
  description,
  adminNote,
}: LeadGiftedProProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>
        Lead offert — coordonnées de {clientFirstName} {clientLastName}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>LEAD OFFERT PAR DEVISRAPIDE</Text>
          <Heading as="h1" style={h1}>
            Un lead vous est offert
          </Heading>
          <Text style={text}>
            Bonne nouvelle, l&apos;équipe DevisRapide vous a directement
            attribué ce lead, gracieusement. Voici les coordonnées
            complètes du client — pensez à le contacter rapidement.
          </Text>

          {adminNote && (
            <Section style={noteCard}>
              <Text style={noteLabel}>Note de l&apos;équipe :</Text>
              <Text style={noteText}>{adminNote}</Text>
            </Section>
          )}

          <Section style={card}>
            <Heading as="h2" style={h2}>
              Client
            </Heading>
            <Row label="Nom" value={`${clientFirstName} ${clientLastName}`} />
            <Row label="Téléphone" value={clientPhone} />
            <Row label="Email" value={clientEmail} />
            <Row
              label="Adresse"
              value={
                address
                  ? `${address}, ${postalCode} ${city}`
                  : `${postalCode} ${city}`
              }
            />
          </Section>

          <Section style={card}>
            <Heading as="h2" style={h2}>
              Projet
            </Heading>
            <Row label="Catégorie" value={`${categoryName} — ${subCategoryName}`} />
            <Row label="Urgence" value={urgencyLabel} />
            <Row label="Montant débité" value="Offert — 0,00 €" />
            <Hr style={hr} />
            <Text style={descriptionText}>{description}</Text>
          </Section>

          <Section style={ctaWrap}>
            <Button href={`tel:${clientPhone}`} style={ctaPrimary}>
              Appeler le client
            </Button>
            <Text style={ctaSpacer}>&nbsp;</Text>
            <Button href={`mailto:${clientEmail}`} style={ctaSecondary}>
              Envoyer un email
            </Button>
          </Section>

          <Text style={footer}>
            Pensez à qualifier le lead après contact depuis votre
            dashboard.
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
  marginBottom: "16px",
};
const h2 = {
  color: "#1e3a8a",
  fontSize: "16px",
  fontWeight: 600,
  margin: "0 0 12px",
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
  margin: "16px 0",
};
const noteCard = {
  backgroundColor: "#fff7ed",
  border: "1px solid #fed7aa",
  borderRadius: "6px",
  padding: "14px 18px",
  margin: "16px 0",
};
const noteLabel = {
  color: "#9a3412",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  margin: "0 0 4px",
};
const noteText = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  margin: 0,
};
const rowText = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "4px 0",
};
const rowLabel = { color: "#6b7280" };
const descriptionText = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "8px 0 0",
  whiteSpace: "pre-wrap" as const,
};
const hr = { borderColor: "#e2e8f0", margin: "12px 0" };
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
const ctaSpacer = { fontSize: "8px", margin: "8px 0" };
const ctaSecondary = {
  backgroundColor: "#ffffff",
  color: "#1e3a8a",
  border: "1px solid #1e3a8a",
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

export default LeadGiftedPro;
