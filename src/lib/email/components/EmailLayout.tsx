import { type ReactNode } from "react";

import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Text,
} from "@react-email/components";

import { colors, fonts, link } from "./theme";

/**
 * Chrome partagé de tous les emails transactionnels : en-tête de marque
 * (wordmark DevisRapide), carte blanche pour le contenu, et footer pro
 * (identité + contact + mention email automatique).
 *
 * Objectif : un rendu cohérent et "branded" qui inspire confiance — un
 * email transactionnel sans en-tête ni footer ressemble à du spam. Le
 * footer (identité claire + contact) participe aussi à la délivrabilité.
 *
 * Mise en page = letterhead classique : wordmark au-dessus de la carte,
 * footer en dessous, le tout centré sur 560px. On évite les images
 * (logo PNG) au profit d'un wordmark texte : toujours rendu, jamais de
 * carré "image bloquée" qui fait justement spam. Pour basculer sur le
 * logo hébergé plus tard, remplacer le <Text> wordmark par un <Img>.
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
        <Container style={brandWrap}>
          <Text style={wordmark}>
            <span style={{ color: colors.brand }}>DevisRapide</span>
            <span style={{ color: colors.accent }}>.be</span>
          </Text>
        </Container>

        <Container style={cardStyle}>{children}</Container>

        <Container style={footerWrap}>
          <Text style={footerBrand}>DevisRapide</Text>
          <Text style={footerText}>
            La plateforme qui met en relation particuliers et artisans
            certifiés en Belgique.
          </Text>
          <Text style={footerText}>
            Une question&nbsp;?{" "}
            <a href="mailto:contact@devisrapide.be" style={link}>
              contact@devisrapide.be
            </a>
          </Text>
          <Text style={footerMuted}>
            © {new Date().getFullYear()} DevisRapide · Belgique · Email
            automatique, merci de ne pas répondre à cette adresse.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: colors.pageBg,
  fontFamily: fonts,
  margin: 0,
  padding: 0,
};

const brandWrap = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "30px 24px 0",
  textAlign: "center" as const,
};

const wordmark = {
  fontSize: "22px",
  fontWeight: 800,
  letterSpacing: "-0.02em",
  margin: 0,
};

const cardStyle = {
  backgroundColor: colors.white,
  margin: "18px auto 0",
  padding: "32px",
  maxWidth: "560px",
  borderRadius: "10px",
  border: `1px solid ${colors.line}`,
  borderTop: `3px solid ${colors.brand}`,
};

const footerWrap = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "22px 24px 36px",
  textAlign: "center" as const,
};

const footerBrand = {
  color: colors.brand,
  fontSize: "14px",
  fontWeight: 700,
  margin: "0 0 6px",
};

const footerText = {
  color: colors.muted,
  fontSize: "12.5px",
  lineHeight: "19px",
  margin: "0 0 4px",
};

const footerMuted = {
  color: colors.faint,
  fontSize: "11.5px",
  lineHeight: "18px",
  margin: "12px 0 0",
};
