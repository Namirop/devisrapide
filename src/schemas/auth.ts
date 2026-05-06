import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().email().transform((s) => s.toLowerCase().trim()),
  password: z.string().min(1, "Mot de passe requis"),
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
