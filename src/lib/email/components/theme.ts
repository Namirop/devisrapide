/**
 * Tokens de style partagés par tous les emails transactionnels.
 *
 * Contrainte email : les <style> et classes sont strippés par la plupart
 * des clients (Gmail, Outlook), donc tout le CSS est inline. On exporte
 * des objets de style React réutilisables plutôt que des classes Tailwind.
 *
 * Couleurs alignées sur la charte (bleu #1e3a8a, orange #ea580c) — cf.
 * docs/design-system.md. Centraliser ici évite que chaque template
 * redéfinisse les ~10 mêmes constantes (body/container/h1/text/cta...).
 */

export const colors = {
  brand: "#1e3a8a",
  accent: "#ea580c",
  ink: "#0f172a",
  text: "#374151",
  muted: "#6b7280",
  faint: "#9aa3b2",
  line: "#e2e8f0",
  cardBg: "#f8fafc",
  pageBg: "#eef2f7",
  white: "#ffffff",
  success: "#16a34a",
  danger: "#dc2626",
} as const;

export const fonts =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const heading = {
  color: colors.brand,
  fontSize: "22px",
  fontWeight: 700,
  lineHeight: "1.25",
  margin: "0 0 16px",
};

export const subheading = {
  color: colors.brand,
  fontSize: "16px",
  fontWeight: 600,
  margin: "0 0 12px",
};

/** Eyebrow : couleur surchargée par template (succès/alerte/neutre). */
export const eyebrow = {
  color: colors.accent,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  margin: "0 0 10px",
};

export const text = {
  color: colors.text,
  fontSize: "15px",
  lineHeight: "23px",
  margin: "0 0 12px",
};

export const textBold = {
  ...text,
  fontWeight: 600,
  color: colors.brand,
  margin: "0 0 8px",
};

export const card = {
  backgroundColor: colors.cardBg,
  border: `1px solid ${colors.line}`,
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "18px 0",
};

export const rowText = {
  color: colors.text,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "5px 0",
};

export const rowLabel = {
  color: colors.muted,
};

export const ctaWrap = {
  textAlign: "center" as const,
  margin: "26px 0 14px",
};

export const ctaPrimary = {
  backgroundColor: colors.accent,
  color: colors.white,
  fontWeight: 600,
  fontSize: "15px",
  padding: "13px 26px",
  borderRadius: "8px",
  textDecoration: "none",
  display: "inline-block",
};

export const ctaSecondary = {
  backgroundColor: colors.white,
  color: colors.brand,
  border: `1px solid ${colors.brand}`,
  fontWeight: 600,
  fontSize: "15px",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  display: "inline-block",
};

export const hr = {
  borderColor: colors.line,
  borderStyle: "solid",
  borderWidth: "1px 0 0",
  margin: "12px 0",
};

/** Note discrète en bas de contenu (rappel, mention). */
export const note = {
  color: colors.muted,
  fontSize: "13px",
  lineHeight: "20px",
  margin: "14px 0 0",
};

/** Signature de fin de message ("— L'équipe DevisRapide"). */
export const signoff = {
  color: colors.muted,
  fontSize: "13px",
  margin: "16px 0 0",
};

export const link = {
  color: colors.brand,
  textDecoration: "underline",
};
