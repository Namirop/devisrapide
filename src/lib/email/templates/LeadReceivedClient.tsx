import { Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/components/EmailLayout";
import {
  heading,
  lead,
  note,
  signoff,
  strong,
  text,
} from "@/lib/email/components/theme";

export type LeadReceivedClientProps = {
  firstName: string;
  /** Categorie metier — utilisee dans l'objet de l'email. */
  categoryName: string;
  /**
   * Sous-categorie utilisee comme "titre projet" entre guillemets dans
   * le corps. Lead n'a pas de champ projectTitle dedie ; la sous-cat
   * decrit ce que veut le client (ex: "Pose de carrelage"), ce qui
   * convient comme intitule court.
   */
  subCategoryName: string;
  city: string;
};

export function LeadReceivedClient({
  firstName,
  subCategoryName,
  city,
}: LeadReceivedClientProps) {
  return (
    <EmailLayout
      preview={`Votre demande à ${city} a bien été enregistrée — nous cherchons vos experts`}
    >
      <Heading as="h1" style={heading}>
        Votre demande est enregistrée
      </Heading>
      <Text style={lead}>
        Bonjour {firstName}, votre demande pour{" "}
        <span style={strong}>«&nbsp;{subCategoryName}&nbsp;»</span> à{" "}
        <span style={strong}>{city}</span> est bien arrivée.
      </Text>
      <Text style={text}>
        Nous avons alerté les professionnels certifiés de votre zone. Jusqu&apos;à
        trois d&apos;entre eux vont vous contacter par téléphone ou e-mail sous
        peu — gardez votre téléphone à portée de main.
      </Text>
      <Text style={text}>
        Le service est gratuit pour vous&nbsp;: vous n&apos;avez rien à payer à
        DevisRapide, et aucune obligation d&apos;accepter les devis qui vous
        seront proposés.
      </Text>

      <Text style={note}>
        Vous n&apos;êtes pas à l&apos;origine de cette demande&nbsp;? Signalez-le
        nous en répondant à l&apos;adresse de contact ci-dessous.
      </Text>
      <Text style={signoff}>L&apos;équipe DevisRapide</Text>
    </EmailLayout>
  );
}

export default LeadReceivedClient;
