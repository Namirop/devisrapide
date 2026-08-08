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

export type NewProSignupAdminProps = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  vatNumber: string | null;
  city: string;
  postalCode: string;
  categoryNames: string[];
  reviewUrl: string;
};

/**
 * Email interne "Nouvelle candidature pro". Envoyé aux comptes ADMIN à
 * chaque inscription, parce qu'un pro en PENDING ne reçoit aucun lead
 * tant que personne ne l'a validé — et rien ne signalait son arrivée.
 *
 * Seul email du projet adressé à l'équipe et non à un utilisateur : il
 * porte donc les faits bruts nécessaires à la décision, sans argumentaire.
 */
export function NewProSignupAdmin({
  companyName,
  contactName,
  email,
  phone,
  vatNumber,
  city,
  postalCode,
  categoryNames,
  reviewUrl,
}: NewProSignupAdminProps) {
  return (
    <EmailLayout preview={`Nouvelle candidature pro : ${companyName}`}>
      <Heading as="h1" style={heading}>
        Nouvelle candidature pro
      </Heading>
      <Text style={lead}>
        {companyName} vient de s&apos;inscrire. Le compte reste en attente et ne
        reçoit aucun lead tant qu&apos;il n&apos;est pas validé.
      </Text>

      <EmailFacts
        items={[
          { label: "Société", value: companyName },
          { label: "Contact", value: contactName },
          { label: "Email", value: email },
          { label: "Téléphone", value: phone },
          {
            label: "N° TVA",
            value: vatNumber ?? "Non renseigné",
            ...(vatNumber ? {} : { tone: "muted" as const }),
          },
          { label: "Zone", value: `${postalCode} ${city}` },
          {
            label: categoryNames.length > 1 ? "Métiers" : "Métier",
            value: categoryNames.join(", ") || "Aucun",
          },
        ]}
      />

      <Section style={ctaWrap}>
        <Button href={reviewUrl} style={ctaPrimary}>
          Examiner la candidature
        </Button>
      </Section>

      <Text style={note}>
        Vérifiez le numéro de TVA avant validation : c&apos;est le seul contrôle
        d&apos;identité de la plateforme.
      </Text>
      <Text style={signoff}>DevisRapide</Text>
    </EmailLayout>
  );
}

export default NewProSignupAdmin;
