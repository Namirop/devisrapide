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
  /** Solde actuel en cents post-debit (sous le seuil). */
  balanceCents: number;
  walletUrl: string;
};

/**
 * Email "Solde wallet bientot vide". Envoye au franchissement
 * du seuil WALLET_LOW_BALANCE_THRESHOLD_CENTS apres un debit lead
 * (auto-accept ou acceptation manuelle). Pendant email du push I.
 *
 * Email opt-in : respecte ProProfile.notifyByEmail via deliver()
 * requiresOptIn. C'est une alerte marketing, pas compliance.
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

// Le solde est LA donnee du mail : rouge parce qu'il porte un etat reel
// (sous le seuil), pas pour decorer.
const balance = {
  color: colors.danger,
  fontWeight: 600,
  fontVariantNumeric: "tabular-nums" as const,
};

export default LowBalancePro;
