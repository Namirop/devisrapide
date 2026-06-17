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
 * Verifie les identifiants de pre-launch et, si valides, pose le cookie de
 * deverrouillage (90j) puis redirige vers la destination demandee. Sur
 * echec → redirection vers /acces?error=1 (le mot de passe n'est jamais
 * renvoye au client). Marche sans JS (progressive enhancement) : la
 * validation client n'est qu'un confort.
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
  if (!token) redirect(errorTarget); // fail-closed : creds env manquants

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
