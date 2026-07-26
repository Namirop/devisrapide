import { Heading, Section, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/components/EmailLayout";
import {
  heading,
  lead,
  link,
  note,
  quoteDanger,
  quoteLabel,
  quoteText,
  signoff,
  text,
} from "@/lib/email/components/theme";

export type ProSuspendedProps = {
  companyName: string;
  reason: string;
};

/**
 * Email "Compte suspendu". Envoyé après suspendProProfile. Le pro perd
 * l'accès aux nouveaux leads jusqu'à reactivation manuelle.
 */
export function ProSuspended({ companyName, reason }: ProSuspendedProps) {
  return (
    <EmailLayout preview="Votre compte DevisRapide a été suspendu">
      <Heading as="h1" style={heading}>
        Accès temporairement suspendu
      </Heading>
      <Text style={lead}>
        Bonjour {companyName}, votre accès à DevisRapide a été suspendu par
        l&apos;administration. Vous ne recevrez plus de nouveaux leads
        jusqu&apos;à nouvel ordre.
      </Text>

      <Section style={quoteDanger}>
        <Text style={quoteLabel}>Raison de la suspension</Text>
        <Text style={quoteText}>{reason}</Text>
      </Section>

      <Text style={text}>
        Votre wallet et l&apos;historique de vos leads restent accessibles depuis
        votre dashboard. Contactez-nous pour discuter d&apos;une réactivation.
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

export default ProSuspended;
