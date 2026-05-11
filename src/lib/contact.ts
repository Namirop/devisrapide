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
