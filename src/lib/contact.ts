// Coordonnées de contact affichées sur /contact et /mentions-legales.
// PHONE_ENABLED garde le rendu conditionnel <a tel:> / <span> au cas où le
// numéro devrait être retiré temporairement.

export const CONTACT = {
  PHONE_DISPLAY: "02 315 58 63",
  PHONE_E164: "+3223155863",
  PHONE_ENABLED: true,
  HOURS: "Lun-Ven · 8h-18h",
  EMAIL: "contact@devisrapide.be",
} as const;

// Identité légale de l'entreprise (pages /contact et /mentions-legales).
// Valeurs communiquées par le client.
export const COMPANY = {
  BCE_NUMBER: "0786.667.723",
  VAT_NUMBER: "BE 0786.667.723",
  ADDRESS_LINE1: "Avenue des Arts 56",
  ADDRESS_LINE2: "1000 Bruxelles",
  COUNTRY: "Belgique",
} as const;
