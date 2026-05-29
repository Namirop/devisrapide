import { Heading, Section, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/components/EmailLayout";
import {
  card,
  eyebrow,
  heading,
  link,
  note,
  signoff,
  text,
  textBold,
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
      <Text style={{ ...eyebrow, color: "#64748b" }}>
        CANDIDATURE NON RETENUE
      </Text>
      <Heading as="h1" style={heading}>
        Nous ne pourrons pas donner suite
      </Heading>
      <Text style={text}>
        Bonjour {companyName}, après examen, votre candidature n&apos;a pas été
        retenue pour rejoindre la plateforme DevisRapide.
      </Text>

      <Section style={card}>
        <Text style={textBold}>Raison communiquée :</Text>
        <Text style={{ ...text, margin: 0 }}>{reason}</Text>
      </Section>

      <Text style={text}>
        Si vous souhaitez contester cette décision ou clarifier la situation,
        n&apos;hésitez pas à nous écrire.
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

export default ProRejected;
