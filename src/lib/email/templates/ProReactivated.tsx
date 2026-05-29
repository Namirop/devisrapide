import { Button, Heading, Section, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/components/EmailLayout";
import {
  colors,
  ctaPrimary,
  ctaWrap,
  eyebrow,
  heading,
  link,
  note,
  signoff,
  text,
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
      <Text style={{ ...eyebrow, color: colors.success }}>COMPTE RÉACTIVÉ</Text>
      <Heading as="h1" style={heading}>
        Bienvenue de retour
      </Heading>
      <Text style={text}>
        Bonjour {companyName}, votre compte DevisRapide a été réactivé. Vous
        allez à nouveau recevoir les leads correspondant à vos critères
        (catégories, zone d&apos;intervention).
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
        .
      </Text>
      <Text style={signoff}>L&apos;équipe DevisRapide</Text>
    </EmailLayout>
  );
}

export default ProReactivated;
