/**
 * Tokens de style partagés par tous les emails transactionnels.
 *
 * Contrainte email : les <style> et classes sont strippés par la plupart
 * des clients (Gmail, Outlook), donc tout le CSS est inline. On exporte
 * des objets de style React réutilisables plutôt que des classes Tailwind.
 *
 * Parti pris visuel : papier à en-tête, pas carte flottante. Fond blanc,
 * contenu aligné à gauche, et un seul dispositif structurel — le filet
 * fin (sous l'en-tête, entre les faits, au-dessus du pied). La couleur
 * de marque reste rare et fonctionnelle : bleu = identité (wordmark) et
 * liens, orange = action primaire uniquement, vert/rouge = état réel.
 * Les titres sont en encre, pas en bleu : c'est leur taille qui porte la
 * hiérarchie. Neutres tous pris dans la même famille froide (slate) pour
 * rester cohérents avec le bleu de marque.
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

/** Titre principal : porte la hiérarchie par sa taille, pas par la couleur. */
export const heading = {
  color: colors.ink,
  fontSize: "26px",
  fontWeight: 700,
  lineHeight: "1.2",
  letterSpacing: "-0.02em",
  margin: "0 0 14px",
};

/** Label de section, rare — seulement quand le contenu se scinde vraiment. */
export const subheading = {
  color: colors.ink,
  fontSize: "14px",
  fontWeight: 700,
  margin: "26px 0 10px",
};

/** Phrase d'ouverture : un cran au-dessus du corps, sans décoration. */
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

/**
 * Bloc cité (raison admin, note d'équipe) : filet latéral au lieu d'une
 * carte. La couleur du filet porte l'état — neutre par défaut, rouge
 * pour une sanction, verte pour une bonne nouvelle.
 */
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

/** CTA aligné à gauche : l'alignement suit la lecture, pas un centrage réflexe. */
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

/** Mention de bas de contenu (rappel, garde-fou). */
export const note = {
  color: colors.muted,
  fontSize: "13px",
  lineHeight: "21px",
  margin: "18px 0 0",
};

/** Signature de fin de message. */
export const signoff = {
  color: colors.muted,
  fontSize: "14px",
  margin: "22px 0 0",
};

export const link = {
  color: colors.brand,
  textDecoration: "underline",
};
