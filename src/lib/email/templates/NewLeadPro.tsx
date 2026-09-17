import { Button, Heading, Section, Text } from "@react-email/components";

import { EmailFacts } from "@/lib/email/components/EmailFacts";
import { EmailLayout } from "@/lib/email/components/EmailLayout";
import {
  ctaPrimary,
  ctaWrap,
  heading,
  lead,
  note,
  signoff,
} from "@/lib/email/components/theme";
import { formatPriceCents } from "@/lib/stats";

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
 * Email au pro à la création d'un LeadAssignment PENDING. Coordonnées du
 * client masquées (prénom + initiale, ni téléphone, ni email, ni adresse) :
 * elles ne sont dévoilées qu'après acceptation (cf. LeadAcceptedPro).
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
  return (
    <EmailLayout preview={`Nouveau lead disponible — ${categoryName}`}>
      <Heading as="h1" style={heading}>
        Nouveau lead à {city}
      </Heading>
      <Text style={lead}>
        Un client cherche un professionnel pour {categoryName} —{" "}
        {subCategoryName}.
      </Text>

      <EmailFacts
        items={[
          {
            label: "Client",
            value: `${clientFirstName} ${clientLastNameInitial}.`,
          },
          { label: "Urgence", value: urgencyLabel },
          { label: "Localisation", value: `${postalCode} ${city}` },
          { label: "Prix du lead", value: formatPriceCents(priceCents) },
        ]}
      />

      <Section style={ctaWrap}>
        <Button href={assignmentUrl} style={ctaPrimary}>
          Voir le lead
        </Button>
      </Section>

      <Text style={note}>
        Téléphone et e-mail du client vous sont communiqués dès que vous
        acceptez.
      </Text>
      <Text style={signoff}>L&apos;équipe DevisRapide</Text>
    </EmailLayout>
  );
}

export default NewLeadPro;
