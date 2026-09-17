import { Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/components/EmailLayout";
import { heading, lead, signoff, text } from "@/lib/email/components/theme";

export type NoMatchClientProps = {
  firstName: string;
  city: string;
};

/**
 * Email « Point sur votre demande », envoyé par le cron check-no-match-leads
 * quand aucun pro n'a retenu la demande après 24 h. Un seul par lead
 * (Lead.noMatchNotifiedAt) : ton rassurant, sans promesse de relance.
 * Pas d'opt-in : le client n'a pas de compte, donc pas de préférences.
 */
export function NoMatchClient({ firstName, city }: NoMatchClientProps) {
  return (
    <EmailLayout preview={`Point sur votre demande à ${city}`}>
      <Heading as="h1" style={heading}>
        Nous cherchons toujours
      </Heading>
      <Text style={lead}>
        Bonjour {firstName}, les professionnels partenaires sont actuellement
        très sollicités autour de {city}.
      </Text>
      <Text style={text}>
        Votre demande reste visible par les professionnels de votre zone :
        dès que l&apos;un d&apos;eux la retient, il vous contacte directement.
        Vous n&apos;avez rien à faire de votre côté.
      </Text>
      <Text style={signoff}>L&apos;équipe DevisRapide</Text>
    </EmailLayout>
  );
}

export default NoMatchClient;
