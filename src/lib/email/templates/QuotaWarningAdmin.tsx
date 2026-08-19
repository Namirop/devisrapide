import { Heading, Text } from "@react-email/components";

import { EmailFacts } from "@/lib/email/components/EmailFacts";
import { EmailLayout } from "@/lib/email/components/EmailLayout";
import { heading, lead, note, signoff } from "@/lib/email/components/theme";

export type QuotaWarningAdminProps = {
  sentToday: number;
  dailyLimit: number;
};

/**
 * Alerte interne "quota d'emails bientôt atteint". Part une seule fois par
 * jour, au franchissement du seuil, pendant que Resend fonctionne encore —
 * c'est tout l'intérêt d'alerter à 60 % : au-delà du plafond, ce canal
 * serait précisément celui qui tombe.
 *
 * Destinée à l'exploitation, pas à un utilisateur : faits bruts et
 * décision à prendre, rien d'autre.
 */
export function QuotaWarningAdmin({
  sentToday,
  dailyLimit,
}: QuotaWarningAdminProps) {
  const remaining = Math.max(dailyLimit - sentToday, 0);

  return (
    <EmailLayout preview={`Quota e-mails : ${sentToday}/${dailyLimit} aujourd'hui`}>
      <Heading as="h1" style={heading}>
        Le quota d&apos;e-mails du jour se remplit
      </Heading>
      <Text style={lead}>
        {sentToday} e-mails sont partis depuis minuit, sur les {dailyLimit} que
        l&apos;offre gratuite autorise par jour. Au-delà, les envois suivants
        sont refusés : les pros ne sont plus prévenus de leurs nouveaux leads,
        et rien ne le signale côté site.
      </Text>

      <EmailFacts
        items={[
          { label: "Envoyés aujourd'hui", value: String(sentToday) },
          { label: "Plafond quotidien", value: String(dailyLimit) },
          {
            label: "Reste",
            value: String(remaining),
            ...(remaining <= 20 ? { tone: "danger" as const } : {}),
          },
        ]}
      />

      <Text style={note}>
        Passer à l&apos;offre payante prend quelques minutes et n&apos;interrompt
        rien. Cette alerte ne part qu&apos;une fois par jour, au franchissement
        du seuil.
      </Text>
      <Text style={signoff}>DevisRapide</Text>
    </EmailLayout>
  );
}

export default QuotaWarningAdmin;
