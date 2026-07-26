import { Button, Heading, Section, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/components/EmailLayout";
import {
  ctaPrimary,
  ctaWrap,
  heading,
  lead,
  note,
  signoff,
  strong,
} from "@/lib/email/components/theme";

export type PasswordResetProProps = {
  resetUrl: string;
};

/**
 * Email "Réinitialisation de mot de passe" envoyé au pro après une demande
 * via /mot-de-passe-oublie. Email essentiel (sécurité) : jamais filtré par
 * le master-switch notifyByEmail. Le lien expire au bout d'1h (géré côté
 * serveur via PasswordResetToken.expiresAt).
 */
export function PasswordResetPro({ resetUrl }: PasswordResetProProps) {
  return (
    <EmailLayout preview="Réinitialisez votre mot de passe DevisRapide">
      <Heading as="h1" style={heading}>
        Réinitialisez votre mot de passe
      </Heading>
      <Text style={lead}>
        Vous avez demandé un nouveau mot de passe pour votre compte
        professionnel. Ce lien est valable{" "}
        <span style={strong}>une heure</span>.
      </Text>

      <Section style={ctaWrap}>
        <Button href={resetUrl} style={ctaPrimary}>
          Choisir un nouveau mot de passe
        </Button>
      </Section>

      <Text style={note}>
        Si vous n&apos;êtes pas à l&apos;origine de cette demande, ignorez cet
        email&nbsp;: votre mot de passe actuel reste inchangé.
      </Text>
      <Text style={signoff}>L&apos;équipe DevisRapide</Text>
    </EmailLayout>
  );
}

export default PasswordResetPro;
