import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

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
    <Html lang="fr">
      <Head />
      <Preview>
        Votre demande à {city} a bien été enregistrée — nous cherchons vos
        experts
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading as="h1" style={h1}>
            Bonjour {firstName},
          </Heading>
          <Section>
            <Text style={text}>
              Votre demande pour <strong>«&nbsp;{subCategoryName}&nbsp;»</strong>{" "}
              à <strong>{city}</strong> a bien été enregistrée.
            </Text>
            <Heading as="h2" style={h2}>
              La suite
            </Heading>
            <Text style={text}>
              Nous avons alerté les professionnels certifiés dans votre zone.
              Jusqu&apos;à <strong>3 experts maximum</strong> vont vous
              contacter par téléphone ou e-mail sous peu.
            </Text>
            <Heading as="h2" style={h2}>
              Important
            </Heading>
            <Text style={text}>
              Ce service est <strong>100&nbsp;% gratuit</strong> pour vous.
              Vous n&apos;avez rien à payer à DevisRapide et vous n&apos;avez
              aucune obligation d&apos;accepter les devis qui vous seront
              proposés.
            </Text>
            <Text style={textTip}>
              <strong>Conseil&nbsp;:</strong> gardez votre téléphone à portée
              de main !
            </Text>
            <Text style={footer}>L&apos;équipe DevisRapide</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f5f5f5",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "32px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const h1 = {
  color: "#111827",
  fontSize: "20px",
  fontWeight: 600,
  marginBottom: "16px",
};

const h2 = {
  color: "#111827",
  fontSize: "15px",
  fontWeight: 600,
  marginTop: "20px",
  marginBottom: "8px",
};

const text = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "22px",
};

const textTip = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "22px",
  marginTop: "20px",
};

const footer = {
  color: "#6b7280",
  fontSize: "13px",
  marginTop: "24px",
};

export default LeadReceivedClient;
