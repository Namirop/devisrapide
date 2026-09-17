/**
 * Tokens de style des emails. Gmail et Outlook suppriment <style> et
 * classes : tout le CSS est inline, via des objets de style React.
 *
 * Couleur de marque rare et fonctionnelle : bleu = identité et liens,
 * orange = action primaire, vert/rouge = état réel.
 */

export const colors = {
  brand: "#1e3a8a",
  accent: "#ea580c",
  ink: "#0f172a",
  text: "#334155",
  muted: "#64748b",
  faint: "#94a3b8",
  line: "#e2e8f0",
  lineStrong: "#cbd5e1",
  white: "#ffffff",
  success: "#15803d",
  danger: "#b91c1c",
} as const;

export const fonts =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const heading = {
  color: colors.ink,
  fontSize: "26px",
  fontWeight: 700,
  lineHeight: "1.2",
  letterSpacing: "-0.02em",
  margin: "0 0 14px",
};

export const subheading = {
  color: colors.ink,
  fontSize: "14px",
  fontWeight: 700,
  margin: "26px 0 10px",
};

export const lead = {
  color: colors.text,
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 14px",
};

export const text = {
  color: colors.text,
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 12px",
};

export const strong = {
  color: colors.ink,
  fontWeight: 600,
};

/** Bloc cité (raison admin, note) : la couleur du filet porte l'état. */
export const quote = {
  borderLeft: `3px solid ${colors.lineStrong}`,
  padding: "0 0 0 16px",
  margin: "20px 0",
};

export const quoteDanger = { ...quote, borderLeft: `3px solid ${colors.danger}` };
export const quoteSuccess = {
  ...quote,
  borderLeft: `3px solid ${colors.success}`,
};

export const quoteLabel = {
  color: colors.muted,
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  margin: "0 0 4px",
};

export const quoteText = {
  color: colors.text,
  fontSize: "15px",
  lineHeight: "24px",
  margin: 0,
};

export const ctaWrap = {
  textAlign: "left" as const,
  margin: "24px 0 20px",
};

export const ctaPrimary = {
  backgroundColor: colors.accent,
  color: colors.white,
  fontWeight: 600,
  fontSize: "15px",
  padding: "13px 24px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
};

export const ctaSecondary = {
  backgroundColor: colors.white,
  color: colors.ink,
  border: `1px solid ${colors.lineStrong}`,
  fontWeight: 600,
  fontSize: "15px",
  padding: "12px 22px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
};

export const note = {
  color: colors.muted,
  fontSize: "13px",
  lineHeight: "21px",
  margin: "18px 0 0",
};

export const signoff = {
  color: colors.muted,
  fontSize: "14px",
  margin: "22px 0 0",
};

export const link = {
  color: colors.brand,
  textDecoration: "underline",
};
