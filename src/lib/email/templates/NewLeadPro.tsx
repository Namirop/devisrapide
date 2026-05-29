import { Button, Heading, Section, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/components/EmailLayout";
import { EmailRow } from "@/lib/email/components/EmailRow";
import {
  card,
  ctaPrimary,
  ctaWrap,
  heading,
  note,
  signoff,
  text,
} from "@/lib/email/components/theme";

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
    <EmailLayout preview={`Nouveau lead disponible — ${categoryName}`}>
      <Heading as="h1" style={heading}>
        Nouveau lead disponible
      </Heading>
      <Text style={text}>
        Un client recherche un artisan pour&nbsp;:{" "}
        <strong>{categoryName}</strong> — {subCategoryName}.
      </Text>

      <Section style={card}>
        <EmailRow
          label="Client"
          value={`${clientFirstName} ${clientLastNameInitial}.`}
        />
        <EmailRow label="Urgence" value={urgencyLabel} />
        <EmailRow label="Localisation" value={`${postalCode} ${city}`} />
        <EmailRow label="Prix du lead" value={`${priceEur} €`} />
      </Section>

      <Text style={text}>
        Acceptez ce lead pour obtenir les coordonnées complètes du client et le
        contacter.
      </Text>

      <Section style={ctaWrap}>
        <Button href={assignmentUrl} style={ctaPrimary}>
          Voir le lead
        </Button>
      </Section>

      <Text style={note}>
        Téléphone et email du client disponibles après acceptation.
      </Text>
      <Text style={signoff}>L&apos;équipe DevisRapide</Text>
    </EmailLayout>
  );
}

export default NewLeadPro;
