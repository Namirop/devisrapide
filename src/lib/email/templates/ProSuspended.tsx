import { Heading, Section, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/components/EmailLayout";
import {
  colors,
  eyebrow,
  heading,
  link,
  note,
  signoff,
  text,
  textBold,
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
      <Text style={{ ...eyebrow, color: colors.danger }}>COMPTE SUSPENDU</Text>
      <Heading as="h1" style={heading}>
        Accès temporairement suspendu
      </Heading>
      <Text style={text}>
        Bonjour {companyName}, votre accès à la plateforme DevisRapide a été
        suspendu par l&apos;administration. Vous ne recevrez plus de nouveaux
        leads jusqu&apos;à nouvel ordre.
      </Text>

      <Section style={dangerCard}>
        <Text style={textBold}>Raison de la suspension :</Text>
        <Text style={{ ...text, margin: 0 }}>{reason}</Text>
      </Section>

      <Text style={text}>
        Votre wallet et l&apos;historique de vos leads restent accessibles depuis
        votre dashboard. Contactez-nous pour discuter d&apos;une éventuelle
        réactivation.
      </Text>

      <Text style={note}>
        Contactez{" "}
        <a href="mailto:contact@devisrapide.be" style={link}>
          contact@devisrapide.be
        </a>
        .
      </Text>
      <Text style={signoff}>L&apos;équipe DevisRapide</Text>
    </EmailLayout>
  );
}

const dangerCard = {
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "18px 0",
};

export default ProSuspended;
