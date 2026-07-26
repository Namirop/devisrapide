import { Heading, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/components/EmailLayout";
import { heading, signoff, subheading, text } from "@/lib/email/components/theme";

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
        Bonjour {firstName},
      </Heading>
      <Text style={text}>
        Votre demande pour <strong>«&nbsp;{subCategoryName}&nbsp;»</strong> à{" "}
        <strong>{city}</strong> a bien été enregistrée.
      </Text>

      <Heading as="h2" style={subheading}>
        La suite
      </Heading>
      <Text style={text}>
        Nous avons alerté les professionnels certifiés dans votre zone.
        Jusqu&apos;à <strong>3 experts maximum</strong> vont vous contacter par
        téléphone ou e-mail sous peu.
      </Text>

      <Heading as="h2" style={subheading}>
        Important
      </Heading>
      <Text style={text}>
        Ce service est <strong>100&nbsp;% gratuit</strong>{" "}
        pour vous. Vous n&apos;avez rien à payer à DevisRapide et vous
        n&apos;avez aucune obligation d&apos;accepter les devis qui vous seront
        proposés.
      </Text>
      <Text style={text}>
        <strong>Conseil&nbsp;:</strong>{" "}gardez votre téléphone à portée de
        main&nbsp;!
      </Text>

      <Text style={signoff}>L&apos;équipe DevisRapide</Text>
    </EmailLayout>
  );
}

export default LeadReceivedClient;
