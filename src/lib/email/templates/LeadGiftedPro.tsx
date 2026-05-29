import { Button, Heading, Hr, Section, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/components/EmailLayout";
import { EmailRow } from "@/lib/email/components/EmailRow";
import {
  card,
  colors,
  ctaPrimary,
  ctaSecondary,
  ctaWrap,
  eyebrow,
  heading,
  hr,
  note,
  signoff,
  subheading,
  text,
} from "@/lib/email/components/theme";

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
    <EmailLayout
      preview={`Lead offert — coordonnées de ${clientFirstName} ${clientLastName}`}
    >
      <Text style={eyebrow}>LEAD OFFERT PAR DEVISRAPIDE</Text>
      <Heading as="h1" style={heading}>
        Un lead vous est offert
      </Heading>
      <Text style={text}>
        Bonne nouvelle, l&apos;équipe DevisRapide vous a directement attribué ce
        lead, gracieusement. Voici les coordonnées complètes du client — pensez
        à le contacter rapidement.
      </Text>

      {adminNote && (
        <Section style={noteCard}>
          <Text style={noteLabel}>Note de l&apos;équipe :</Text>
          <Text style={noteText}>{adminNote}</Text>
        </Section>
      )}

      <Section style={card}>
        <Heading as="h2" style={subheading}>
          Client
        </Heading>
        <EmailRow label="Nom" value={`${clientFirstName} ${clientLastName}`} />
        <EmailRow label="Téléphone" value={clientPhone} />
        <EmailRow label="Email" value={clientEmail} />
        <EmailRow
          label="Adresse"
          value={
            address
              ? `${address}, ${postalCode} ${city}`
              : `${postalCode} ${city}`
          }
        />
      </Section>

      <Section style={card}>
        <Heading as="h2" style={subheading}>
          Projet
        </Heading>
        <EmailRow
          label="Catégorie"
          value={`${categoryName} — ${subCategoryName}`}
        />
        <EmailRow label="Urgence" value={urgencyLabel} />
        <EmailRow label="Montant débité" value="Offert — 0,00 €" />
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

      <Text style={note}>
        Pensez à qualifier le lead après contact depuis votre dashboard.
      </Text>
      <Text style={signoff}>L&apos;équipe DevisRapide</Text>
    </EmailLayout>
  );
}

const noteCard = {
  backgroundColor: "#fff7ed",
  border: "1px solid #fed7aa",
  borderRadius: "8px",
  padding: "14px 18px",
  margin: "18px 0",
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
  color: colors.text,
  fontSize: "14px",
  lineHeight: "22px",
  margin: 0,
};
const descriptionText = {
  color: colors.text,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "8px 0 0",
  whiteSpace: "pre-wrap" as const,
};
const ctaSpacer = { fontSize: "8px", margin: "8px 0" };

export default LeadGiftedPro;
