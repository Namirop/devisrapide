import { Button, Heading, Section, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/components/EmailLayout";
import {
  card,
  colors,
  ctaPrimary,
  ctaWrap,
  eyebrow,
  heading,
  link,
  note,
  signoff,
  text,
  textBold,
} from "@/lib/email/components/theme";

export type ProValidatedProps = {
  companyName: string;
  dashboardUrl: string;
};

/**
 * Email "Compte pro validé". Envoyé après validateProProfile par
 * l'admin. Le pro peut désormais accéder à son dashboard et recevoir
 * des leads.
 */
export function ProValidated({ companyName, dashboardUrl }: ProValidatedProps) {
  return (
    <EmailLayout preview="Votre compte DevisRapide est validé">
      <Text style={{ ...eyebrow, color: colors.success }}>
        VALIDATION CONFIRMÉE
      </Text>
      <Heading as="h1" style={heading}>
        Bienvenue sur DevisRapide
      </Heading>
      <Text style={text}>
        Bonjour {companyName}, votre candidature a été validée par notre équipe.
        Vous pouvez dès maintenant accéder à votre espace professionnel et
        commencer à recevoir des demandes de devis.
      </Text>

      <Section style={card}>
        <Text style={textBold}>Prochaines étapes :</Text>
        <Text style={text}>
          1. Complétez votre profil (photo, description, métiers).
        </Text>
        <Text style={text}>
          2. Rechargez votre wallet pour acheter vos premiers leads.
        </Text>
        <Text style={{ ...text, margin: 0 }}>
          3. Activez Auto-accept pour ne rater aucune opportunité.
        </Text>
      </Section>

      <Section style={ctaWrap}>
        <Button href={dashboardUrl} style={ctaPrimary}>
          Accéder à mon dashboard
        </Button>
      </Section>

      <Text style={note}>
        Une question&nbsp;? Contactez{" "}
        <a href="mailto:contact@devisrapide.be" style={link}>
          contact@devisrapide.be
        </a>
        .
      </Text>
      <Text style={signoff}>L&apos;équipe DevisRapide</Text>
    </EmailLayout>
  );
}

export default ProValidated;
