import { Button, Heading, Section, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/components/EmailLayout";
import {
  colors,
  ctaPrimary,
  ctaWrap,
  eyebrow,
  heading,
  note,
  signoff,
  text,
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
      <Text style={{ ...eyebrow, color: colors.brand }}>SÉCURITÉ DU COMPTE</Text>
      <Heading as="h1" style={heading}>
        Réinitialisez votre mot de passe
      </Heading>
      <Text style={text}>
        Vous avez demandé à réinitialiser le mot de passe de votre compte
        professionnel DevisRapide. Cliquez sur le bouton ci-dessous pour en
        choisir un nouveau. Ce lien est valable <strong>1 heure</strong>.
      </Text>

      <Section style={ctaWrap}>
        <Button href={resetUrl} style={ctaPrimary}>
          Réinitialiser mon mot de passe
        </Button>
      </Section>

      <Text style={note}>
        Si vous n&apos;êtes pas à l&apos;origine de cette demande, ignorez cet
        email : votre mot de passe actuel reste inchangé.
      </Text>
      <Text style={signoff}>L&apos;équipe DevisRapide</Text>
    </EmailLayout>
  );
}

export default PasswordResetPro;
