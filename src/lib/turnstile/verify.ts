// Verification cote serveur d'un token Cloudflare Turnstile.
//
// Appele depuis les Server Actions sensibles (createLead,
// submitProRegistration) + depuis le Credentials provider Auth.js
// (authorize callback). Pattern : si verify rate -> rejet du flow.
//
// Strategie dev sans keys :
//   - Si TURNSTILE_SECRET_KEY absent ET NODE_ENV != production :
//     skip verification (return success). Le client utilise la test
//     sitekey "1x00000000000000000000AA" (always passes) qui retourne
//     un vrai token JSON impossible a verifier sans la matching test
//     secret -> on bypass plutot que d'imposer la config en dev local.
//   - Si TURNSTILE_SECRET_KEY absent en production : reject (safety).
//   - Si TURNSTILE_SECRET_KEY present : appel reel a Cloudflare
//     siteverify endpoint, parsing reponse.

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
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Dev sans secret : bypass verification. En prod sans secret : reject.
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      return { success: true };
    }
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
