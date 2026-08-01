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
  subheading,
  text,
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
      <Heading as="h1" style={heading}>
        Bienvenue sur DevisRapide
      </Heading>
      <Text style={lead}>
        Bonjour {companyName}, votre candidature est validée. Vous pouvez dès
        maintenant accéder à votre espace professionnel et recevoir des demandes
        de devis.
      </Text>

      <Section style={ctaWrap}>
        <Button href={dashboardUrl} style={ctaPrimary}>
          Accéder à mon dashboard
        </Button>
      </Section>

      <Heading as="h2" style={subheading}>
        Pour bien démarrer
      </Heading>
      <Text style={step}>
        — Complétez votre profil (description, métiers couverts, zone
        d&apos;intervention).
      </Text>
      <Text style={step}>
        — Rechargez votre wallet pour acheter vos premiers leads.
      </Text>
      <Text style={{ ...step, marginBottom: 0 }}>
        — Activez l&apos;auto-accept si vous ne voulez rater aucune opportunité.
      </Text>

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

// Etapes en liste typographique (tiret cadratin) plutot qu'en carte
// numerotee : trois lignes ne justifient pas un conteneur.
const step = {
  ...text,
  margin: "0 0 6px",
  paddingLeft: "16px",
  textIndent: "-16px",
};

export default ProValidated;
