import { Button, Heading, Hr, Section, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/components/EmailLayout";
import { EmailRow } from "@/lib/email/components/EmailRow";
import {
  card,
  colors,
  ctaPrimary,
  ctaSecondary,
  ctaWrap,
  heading,
  hr,
  note,
  signoff,
  subheading,
  text,
} from "@/lib/email/components/theme";

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
 * Email envoye au pro apres acceptation d'un lead (manuelle ou auto).
 * Coordonnees client completes : nom, email, telephone, adresse,
 * description complete du projet. CTA principal "Voir les coordonnees"
 * + CTAs directs `tel:` et `mailto:` pour usage mobile rapide.
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
  const priceEur = (priceCents / 100).toFixed(2).replace(".", ",");
  return (
    <EmailLayout
      preview={`Lead accepté — coordonnées de ${clientFirstName} disponibles`}
    >
      <Heading as="h1" style={heading}>
        Lead accepté
      </Heading>
      <Text style={text}>
        Bonjour {companyName}, vous avez bien accepté le lead{" "}
        <strong>«&nbsp;{subCategoryName}&nbsp;»</strong> de{" "}
        <strong>{clientFirstName}</strong> à <strong>{city}</strong>. Les
        coordonnées du client sont désormais disponibles dans votre dashboard.
      </Text>
      <Text style={text}>
        Contactez-le rapidement pour maximiser vos chances de signer&nbsp;!
      </Text>

      <Section style={ctaWrap}>
        <Button href={assignmentUrl} style={ctaPrimary}>
          Voir les coordonnées
        </Button>
      </Section>

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
        <EmailRow label="Montant débité" value={`${priceEur} €`} />
        <Hr style={hr} />
        <Text style={descriptionText}>{description}</Text>
      </Section>

      <Section style={ctaWrap}>
        <Button href={`tel:${clientPhone}`} style={ctaSecondary}>
          Appeler le client
        </Button>
        <Text style={ctaSpacer}>&nbsp;</Text>
        <Button href={`mailto:${clientEmail}`} style={ctaSecondary}>
          Envoyer un email
        </Button>
      </Section>

      <Text style={note}>
        Pensez à qualifier le lead après contact (converti, sans suite,
        injoignable) depuis votre dashboard.
      </Text>
      <Text style={signoff}>L&apos;équipe DevisRapide</Text>
    </EmailLayout>
  );
}

const descriptionText = {
  color: colors.text,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "8px 0 0",
  whiteSpace: "pre-wrap" as const,
};

const ctaSpacer = {
  fontSize: "8px",
  margin: "8px 0",
};

export default LeadAcceptedPro;
