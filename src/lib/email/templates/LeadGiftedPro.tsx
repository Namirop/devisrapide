import { Button, Heading, Section, Text } from "@react-email/components";

import { EmailFacts } from "@/lib/email/components/EmailFacts";
import { EmailLayout } from "@/lib/email/components/EmailLayout";
import {
  colors,
  ctaPrimary,
  ctaSecondary,
  ctaWrap,
  heading,
  lead,
  note,
  quoteLabel,
  quoteSuccess,
  quoteText,
  signoff,
  subheading,
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
 * Email au pro à qui un admin a offert un lead. Variante de LeadAcceptedPro,
 * sans montant débité et avec la note admin éventuelle.
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
      <Heading as="h1" style={heading}>
        Un lead vous est offert
      </Heading>
      <Text style={lead}>
        L&apos;équipe DevisRapide vous attribue ce lead gracieusement — rien
        n&apos;est débité de votre wallet. Voici les coordonnées complètes du
        client.
      </Text>

      {adminNote && (
        <Section style={quoteSuccess}>
          <Text style={quoteLabel}>Note de l&apos;équipe</Text>
          <Text style={quoteText}>{adminNote}</Text>
        </Section>
      )}

      <EmailFacts
        items={[
          { label: "Nom", value: `${clientFirstName} ${clientLastName}` },
          { label: "Téléphone", value: clientPhone },
          { label: "E-mail", value: clientEmail },
          {
            label: "Adresse",
            value: address
              ? `${address}, ${postalCode} ${city}`
              : `${postalCode} ${city}`,
          },
        ]}
      />

      <Section style={ctaWrap}>
        <Button href={`tel:${clientPhone}`} style={ctaPrimary}>
          Appeler le client
        </Button>
        <Text style={ctaSpacer}>&nbsp;</Text>
        <Button href={`mailto:${clientEmail}`} style={ctaSecondary}>
          Envoyer un e-mail
        </Button>
      </Section>

      <Heading as="h2" style={subheading}>
        Le projet
      </Heading>
      <EmailFacts
        items={[
          { label: "Catégorie", value: `${categoryName} — ${subCategoryName}` },
          { label: "Urgence", value: urgencyLabel },
          { label: "Montant débité", value: "Offert", tone: "success" },
        ]}
      />
      <Text style={descriptionText}>{description}</Text>

      <Text style={note}>
        Pensez à qualifier le lead après contact depuis votre dashboard.
      </Text>
      <Text style={signoff}>L&apos;équipe DevisRapide</Text>
    </EmailLayout>
  );
}

// Description du client citée avec un filet, comme les autres textes
// rapportés (motif admin, note d'équipe).
const descriptionText = {
  color: colors.text,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 4px",
  paddingLeft: "16px",
  borderLeft: `3px solid ${colors.lineStrong}`,
  whiteSpace: "pre-wrap" as const,
};

// Espace entre deux boutons : Outlook ignore les marges des inline-block,
// un <Text> vide est la technique fiable.
const ctaSpacer = {
  display: "inline-block",
  width: "8px",
  margin: 0,
};

export default LeadGiftedPro;
