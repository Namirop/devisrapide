import { Heading, Section, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/components/EmailLayout";
import {
  heading,
  lead,
  link,
  note,
  quote,
  quoteLabel,
  quoteText,
  signoff,
  text,
} from "@/lib/email/components/theme";

export type ProRejectedProps = {
  companyName: string;
  reason: string;
};

/**
 * Email "Candidature refusée". Envoyé après rejectProProfile. Inclut
 * la raison saisie par l'admin pour transparence. Etat terminal V1.
 */
export function ProRejected({ companyName, reason }: ProRejectedProps) {
  return (
    <EmailLayout preview="Votre candidature n'a pas été retenue">
      <Heading as="h1" style={heading}>
        Nous ne pourrons pas donner suite
      </Heading>
      <Text style={lead}>
        Bonjour {companyName}, après examen, votre candidature n&apos;a pas été
        retenue pour rejoindre DevisRapide.
      </Text>

      <Section style={quote}>
        <Text style={quoteLabel}>Raison communiquée</Text>
        <Text style={quoteText}>{reason}</Text>
      </Section>

      <Text style={text}>
        Si vous souhaitez contester cette décision ou clarifier la situation,
        écrivez-nous&nbsp;: nous réexaminons volontiers un dossier complété.
      </Text>

      <Text style={note}>
        <a href="mailto:contact@devisrapide.be" style={link}>
          contact@devisrapide.be
        </a>
      </Text>
      <Text style={signoff}>L&apos;équipe DevisRapide</Text>
    </EmailLayout>
  );
}

export default ProRejected;
