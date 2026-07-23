// Numéro de téléphone et horaires affichés dans le header / footer.
// Au launch : numéro placeholder non cliquable (PHONE_DISPLAY visible,
// PHONE_ENABLED = false → on rend un <span>, pas un <a>).
// Quand Romain a le vrai numéro, swap PHONE_E164 + PHONE_ENABLED = true.

export const CONTACT = {
  PHONE_DISPLAY: "02 XXX XX XX",
  PHONE_E164: "",
  PHONE_ENABLED: false,
  HOURS: "Lun-Ven · 8h-18h",
  EMAIL: "contact@devisrapide.be",
} as const;

// Identité légale de l'entreprise (page /contact). Valeurs communiquées par
// Kamel. mentions-legales/page.tsx a ses propres "[À COMPLÉTER]" séparés
// pour la même info (siège social, BCE/TVA) : pas encore unifiés avec ceci.
export const COMPANY = {
  BCE_NUMBER: "0786.667.723",
  VAT_NUMBER: "BE 0786.667.723",
  ADDRESS_LINE1: "Avenue des Arts 56",
  ADDRESS_LINE2: "1000 Bruxelles",
  COUNTRY: "Belgique",
} as const;
