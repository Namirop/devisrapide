import { type ReactNode } from "react";

import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import { colors, fonts, link } from "./theme";

/**
 * Chrome partagé de tous les emails transactionnels : en-tête de marque
 * (wordmark DevisRapide), corps de lettre, et pied (identité + contact +
 * mention email automatique).
 *
 * Mise en page = papier à en-tête, pas carte flottante sur fond gris :
 * feuille blanche, contenu aligné à gauche, et des filets fins comme
 * seul dispositif de structure (sous le wordmark, au-dessus du pied).
 * Un email transactionnel sans en-tête ni pied ressemble à du spam ; le
 * pied (identité claire + contact) participe aussi à la délivrabilité.
 *
 * On évite les images (logo PNG) au profit d'un wordmark texte : toujours
 * rendu, jamais de carré "image bloquée" qui fait justement spam. Pour
 * basculer sur le logo hébergé plus tard, remplacer le <Text> par un <Img>.
 */
export function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={sheet}>
          <Section style={header}>
            <Text style={wordmark}>
              <span style={{ color: colors.brand }}>DevisRapide</span>
              <span style={{ color: colors.accent }}>.be</span>
            </Text>
          </Section>

          {children}

          <Section style={footer}>
            <Text style={footerText}>
              DevisRapide met en relation particuliers et professionnels
              certifiés en Belgique. Une question&nbsp;?{" "}
              <a href="mailto:contact@devisrapide.be" style={link}>
                contact@devisrapide.be
              </a>
            </Text>
            <Text style={footerMuted}>
              © {new Date().getFullYear()} DevisRapide · Belgique · Email
              automatique, merci de ne pas répondre à cette adresse.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: colors.white,
  fontFamily: fonts,
  margin: 0,
  padding: 0,
};

const sheet = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "32px 24px 40px",
};

const header = {
  borderBottom: `1px solid ${colors.line}`,
  paddingBottom: "18px",
  marginBottom: "28px",
};

const wordmark = {
  fontSize: "19px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  margin: 0,
};

const footer = {
  borderTop: `1px solid ${colors.line}`,
  marginTop: "36px",
  paddingTop: "18px",
};

const footerText = {
  color: colors.muted,
  fontSize: "12.5px",
  lineHeight: "20px",
  margin: 0,
};

const footerMuted = {
  color: colors.faint,
  fontSize: "11.5px",
  lineHeight: "18px",
  margin: "8px 0 0",
};
