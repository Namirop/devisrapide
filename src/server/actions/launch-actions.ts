"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  LAUNCH_COOKIE_MAX_AGE_SECONDS,
  LAUNCH_COOKIE_NAME,
  computeLaunchToken,
  isLaunchProtectEnabled,
  isSafeNext,
  verifyLaunchCredentials,
} from "@/lib/launch-protect";

const schema = z.object({
  username: z.string().min(1).max(200),
  password: z.string().min(1).max(200),
  next: z.string().max(2000).optional(),
});

/**
 * Vérifie les identifiants de pré-lancement, pose le cookie de déverrouillage
 * (90 jours) et redirige vers `next` s'il est sûr. En cas d'échec : retour
 * sur /acces?error=1, sans jamais renvoyer le mot de passe au client.
 */
export async function unlockLaunchGate(formData: FormData): Promise<void> {
  if (!isLaunchProtectEnabled()) redirect("/");

  const parsed = schema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  const rawNext = parsed.success ? parsed.data.next : undefined;
  const safeNext = rawNext && isSafeNext(rawNext) ? rawNext : "/";
  const errorTarget =
    rawNext && isSafeNext(rawNext)
      ? `/acces?error=1&next=${encodeURIComponent(rawNext)}`
      : "/acces?error=1";

  if (!parsed.success) redirect(errorTarget);
  if (!verifyLaunchCredentials(parsed.data.username, parsed.data.password)) {
    redirect(errorTarget);
  }

  const token = await computeLaunchToken();
  if (!token) redirect(errorTarget); // Fail-closed : identifiants d'env absents

  const jar = await cookies();
  jar.set(LAUNCH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: LAUNCH_COOKIE_MAX_AGE_SECONDS,
  });

  redirect(safeNext);
}
