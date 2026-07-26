import { Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/components/EmailLayout";
import { heading, lead, signoff, text } from "@/lib/email/components/theme";

export type NoMatchClientProps = {
  firstName: string;
  city: string;
};

/**
 * Email "Point sur votre demande". Envoye au client par le
 * cron check-no-match-leads quand aucun pro n'a accepte sous 24h+ et
 * que la demande n'a pas encore recu de follow-up.
 *
 * Ton rassurant, pas alarmiste : "nos artisans sont sollicites, on
 * cherche". Une seule occurrence par lead (Lead.noMatchNotifiedAt).
 *
 * Pas de toggle email (le client n'a pas de compte, donc pas de
 * preferences notifications).
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
        Nos recherches continuent. Si aucune disponibilité ne se libère
        d&apos;ici 48 heures, nous vous en informerons directement — vous
        n&apos;avez rien à faire de votre côté.
      </Text>
      <Text style={signoff}>L&apos;équipe DevisRapide</Text>
    </EmailLayout>
  );
}

export default NoMatchClient;
