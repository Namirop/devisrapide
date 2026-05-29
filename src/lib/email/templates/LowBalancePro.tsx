import { Button, Heading, Section, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/components/EmailLayout";
import {
  ctaPrimary,
  ctaWrap,
  eyebrow,
  heading,
  note,
  signoff,
  text,
} from "@/lib/email/components/theme";

export type LowBalanceProProps = {
  companyName: string;
  /** Solde actuel en cents post-debit (sous le seuil). */
  balanceCents: number;
  walletUrl: string;
};

/**
 * Email "Solde wallet bientot vide" (Kamel I). Envoye au franchissement
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
  const balanceEur = Math.round(balanceCents / 100);
  return (
    <EmailLayout preview="Attention : votre solde DevisRapide est bientôt vide">
      <Text style={eyebrow}>SOLDE FAIBLE</Text>
      <Heading as="h1" style={heading}>
        ⚠️ Attention : solde bientôt vide
      </Heading>
      <Text style={text}>
        Bonjour {companyName}, il ne vous reste que{" "}
        <strong>{balanceEur}&nbsp;€</strong> de crédits sur votre wallet
        DevisRapide.
      </Text>
      <Text style={text}>
        Rechargez maintenant pour ne pas rater les prochains chantiers
        disponibles dans votre zone.
      </Text>

      <Section style={ctaWrap}>
        <Button href={walletUrl} style={ctaPrimary}>
          Recharger maintenant
        </Button>
      </Section>

      <Text style={note}>
        Vous pouvez gérer vos préférences de notifications depuis votre espace
        pro.
      </Text>
      <Text style={signoff}>L&apos;équipe DevisRapide</Text>
    </EmailLayout>
  );
}

export default LowBalancePro;
