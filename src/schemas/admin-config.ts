import { z } from "zod";

/**
 * Kill switch « création de leads ». Le mot de passe admin confirme l'action
 * (re-vérification bcrypt côté serveur) et n'est jamais écrit dans l'AuditLog.
 */
export const toggleLeadCreationSchema = z.object({
  enabled: z.boolean(),
  password: z.string().min(1, "Mot de passe requis.").max(200),
});

export type ToggleLeadCreationInput = z.infer<typeof toggleLeadCreationSchema>;

/**
 * Réglages du cycle de vie d'un lead (AppConfig), lus par le matching et le
 * cron `process-leads`. Ce cron s'arrête si `RADIUS_PALIERS_KM` a moins de
 * 3 entrées ou `ZONE_EXPANSION_DELAYS_MIN` moins de 2 : l'admin saisit donc
 * des valeurs unitaires et l'action reconstruit les tableaux (3e palier figé
 * à -1, « toute la Belgique »). Les bornes croisées écartent les
 * combinaisons incohérentes.
 */
export const leadSettingsSchema = z
  .object({
    souffranceHours: z.coerce
      .number()
      .int("Nombre entier attendu.")
      .min(1, "Minimum 1 heure.")
      .max(168, "Maximum 168 heures (7 jours)."),
    globalTimeoutHours: z.coerce
      .number()
      .int("Nombre entier attendu.")
      .min(1, "Minimum 1 heure.")
      .max(720, "Maximum 720 heures (30 jours)."),
    maxAcceptances: z.coerce
      .number()
      .int("Nombre entier attendu.")
      .min(1, "Minimum 1 acheteur.")
      .max(10, "Maximum 10 acheteurs."),
    radiusInitialKm: z.coerce
      .number()
      .int("Nombre entier attendu.")
      .min(1, "Minimum 1 km.")
      .max(500, "Maximum 500 km."),
    radiusExpandedKm: z.coerce
      .number()
      .int("Nombre entier attendu.")
      .min(1, "Minimum 1 km.")
      .max(500, "Maximum 500 km."),
    expansionDelay1Min: z.coerce
      .number()
      .int("Nombre entier attendu.")
      .min(1, "Minimum 1 minute.")
      .max(10080, "Maximum 10080 minutes (7 jours)."),
    expansionDelay2Min: z.coerce
      .number()
      .int("Nombre entier attendu.")
      .min(1, "Minimum 1 minute.")
      .max(10080, "Maximum 10080 minutes (7 jours)."),
    password: z.string().min(1, "Mot de passe requis.").max(200),
  })
  .refine((v) => v.souffranceHours <= v.globalTimeoutHours, {
    path: ["souffranceHours"],
    message:
      "Le seuil « en souffrance » doit être inférieur ou égal à la durée d'expiration.",
  })
  .refine((v) => v.radiusExpandedKm > v.radiusInitialKm, {
    path: ["radiusExpandedKm"],
    message: "La zone élargie doit être plus grande que la zone initiale.",
  })
  .refine((v) => v.expansionDelay2Min > v.expansionDelay1Min, {
    path: ["expansionDelay2Min"],
    message: "Le 2e élargissement doit venir après le 1er.",
  });

export type LeadSettingsInput = z.infer<typeof leadSettingsSchema>;
