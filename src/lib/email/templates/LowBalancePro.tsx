import { Button, Heading, Section, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/components/EmailLayout";
import {
  colors,
  ctaPrimary,
  ctaWrap,
  heading,
  lead,
  note,
  signoff,
} from "@/lib/email/components/theme";
import { formatPriceCents } from "@/lib/stats";

export type LowBalanceProProps = {
  companyName: string;
  /** Solde en centimes après le débit (sous le seuil). */
  balanceCents: number;
  walletUrl: string;
};

/**
 * Email « solde bientôt vide », envoyé au franchissement du seuil
 * WALLET_LOW_BALANCE_THRESHOLD_CENTS après un débit de lead ; pendant email
 * de la notification push. Soumis à ProProfile.notifyByEmail
 * (requiresOptIn) : alerte de confort, pas un email essentiel.
 */
export function LowBalancePro({
  companyName,
  balanceCents,
  walletUrl,
}: LowBalanceProProps) {
  return (
    <EmailLayout preview="Votre solde DevisRapide est bientôt vide">
      <Heading as="h1" style={heading}>
        Votre solde est bientôt vide
      </Heading>
      <Text style={lead}>
        Bonjour {companyName}, il vous reste{" "}
        <span style={balance}>{formatPriceCents(balanceCents)}</span> de crédits.
        Sans recharge, vous ne pourrez plus accepter les prochains chantiers de
        votre zone.
      </Text>

      <Section style={ctaWrap}>
        <Button href={walletUrl} style={ctaPrimary}>
          Recharger mon wallet
        </Button>
      </Section>

      <Text style={note}>
        Vous pouvez ajuster vos préférences de notification depuis votre espace
        professionnel.
      </Text>
      <Text style={signoff}>L&apos;équipe DevisRapide</Text>
    </EmailLayout>
  );
}

// Rouge porteur de sens (solde sous le seuil), pas décoratif.
const balance = {
  color: colors.danger,
  fontWeight: 600,
  fontVariantNumeric: "tabular-nums" as const,
};

export default LowBalancePro;
