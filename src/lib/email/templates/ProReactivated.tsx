import { Button, Heading, Section, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/components/EmailLayout";
import {
  ctaPrimary,
  ctaWrap,
  heading,
  lead,
  link,
  note,
  signoff,
} from "@/lib/email/components/theme";

export type ProReactivatedProps = {
  companyName: string;
  dashboardUrl: string;
};

/**
 * Email "Compte réactivé". Envoyé après reactivateProProfile.
 * Le pro va à nouveau recevoir des leads selon ses critères.
 */
export function ProReactivated({
  companyName,
  dashboardUrl,
}: ProReactivatedProps) {
  return (
    <EmailLayout preview="Votre compte DevisRapide a été réactivé">
      <Heading as="h1" style={heading}>
        Bienvenue de retour
      </Heading>
      <Text style={lead}>
        Bonjour {companyName}, votre compte est réactivé. Vous allez à nouveau
        recevoir les leads correspondant à vos critères — catégories et zone
        d&apos;intervention inchangées.
      </Text>

      <Section style={ctaWrap}>
        <Button href={dashboardUrl} style={ctaPrimary}>
          Accéder à mon dashboard
        </Button>
      </Section>

      <Text style={note}>
        Une question&nbsp;?{" "}
        <a href="mailto:contact@devisrapide.be" style={link}>
          contact@devisrapide.be
        </a>
      </Text>
      <Text style={signoff}>L&apos;équipe DevisRapide</Text>
    </EmailLayout>
  );
}

export default ProReactivated;
