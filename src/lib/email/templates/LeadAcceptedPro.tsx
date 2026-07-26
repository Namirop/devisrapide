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
  signoff,
  strong,
  subheading,
} from "@/lib/email/components/theme";
import { formatPriceCents } from "@/lib/stats";

export type LeadAcceptedProProps = {
  /** Pro company name pour personnaliser l'ouverture. */
  companyName: string;
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
  priceCents: number;
  /** URL vers /dashboard/mes-demandes/{id} (vue post-acceptation). */
  assignmentUrl: string;
};

/**
 * Email envoye au pro apres acceptation d'un lead (manuelle ou
 * auto-accept). Contient les coordonnees completes du client — c'est
 * le seul email qui les expose, l'acceptation valant paiement.
 */
export function LeadAcceptedPro({
  companyName,
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
  priceCents,
  assignmentUrl,
}: LeadAcceptedProProps) {
  return (
    <EmailLayout
      preview={`Lead accepté — coordonnées de ${clientFirstName} disponibles`}
    >
      <Heading as="h1" style={heading}>
        Voici les coordonnées de {clientFirstName}
      </Heading>
      <Text style={lead}>
        Bonjour {companyName}, vous avez accepté le lead{" "}
        <span style={strong}>«&nbsp;{subCategoryName}&nbsp;»</span> à{" "}
        <span style={strong}>{city}</span>. Contactez le client rapidement pour
        maximiser vos chances de signer.
      </Text>

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
          { label: "Montant débité", value: formatPriceCents(priceCents) },
        ]}
      />
      <Text style={descriptionText}>{description}</Text>

      <Section style={ctaWrap}>
        <Button href={assignmentUrl} style={ctaSecondary}>
          Ouvrir dans mon dashboard
        </Button>
      </Section>

      <Text style={note}>
        Pensez à qualifier le lead après contact — converti, sans suite ou
        injoignable — depuis votre dashboard.
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

export default LeadAcceptedPro;
