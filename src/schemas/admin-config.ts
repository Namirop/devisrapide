import { z } from "zod";

/**
 * Toggle du kill switch « création de leads ». Le mot de passe admin est
 * exigé pour confirmer l'action (re-auth bcrypt côté serveur). Jamais logué
 * dans l'AuditLog (PII).
 */
export const toggleLeadCreationSchema = z.object({
  enabled: z.boolean(),
  password: z.string().min(1, "Mot de passe requis.").max(200),
});

export type ToggleLeadCreationInput = z.infer<typeof toggleLeadCreationSchema>;
