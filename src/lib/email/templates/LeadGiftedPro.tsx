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
 * Email envoye au pro apres qu'un admin lui a OFFERT un lead via
 * /admin/leads/[id]. Variant de LeadAcceptedPro : pas de prix debite,
 * optionnel adminNote.
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

// Description libre du client : citee au filet, comme les autres blocs
// rapportes (raison admin, note d'equipe).
const descriptionText = {
  color: colors.text,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 4px",
  paddingLeft: "16px",
  borderLeft: `3px solid ${colors.lineStrong}`,
  whiteSpace: "pre-wrap" as const,
};

// Espace entre deux boutons cote a cote : un <Text> vide est la seule
// technique fiable dans Outlook (les margins sur inline-block sautent).
const ctaSpacer = {
  display: "inline-block",
  width: "8px",
  margin: 0,
};

export default LeadGiftedPro;
