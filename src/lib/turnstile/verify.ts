// Vérification serveur d'un token Cloudflare Turnstile, appelée par les
// Server Actions exposées aux bots (demande de devis, inscription pro, mot de
// passe oublié) et par `authorize` du provider Credentials d'Auth.js.
// Hors production : toujours acceptée. En production : rejet si la clé
// secrète manque (fail closed), sinon appel à siteverify.

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type VerifyResult = {
  success: boolean;
  errorCodes?: string[];
};

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
): Promise<VerifyResult> {
  // Hors production, le widget retombe sur la sitekey de test Cloudflare, dont
  // le token n'est vérifiable qu'avec le secret de test associé : pas de
  // vérification en local, quelle que soit la config.
  if (process.env.NODE_ENV !== "production") {
    return { success: true };
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    console.warn(
      "[turnstile/verify] TURNSTILE_SECRET_KEY absent en prod -> reject",
    );
    return { success: false, errorCodes: ["missing-input-secret"] };
  }

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: remoteIp,
      }),
    });
    if (!response.ok) {
      console.error("[turnstile/verify] siteverify HTTP error", {
        status: response.status,
      });
      return { success: false, errorCodes: ["http-error"] };
    }
    const data = (await response.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };
    return {
      success: data.success === true,
      errorCodes: data["error-codes"],
    };
  } catch (err) {
    console.error("[turnstile/verify] siteverify network error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, errorCodes: ["network-error"] };
  }
}
