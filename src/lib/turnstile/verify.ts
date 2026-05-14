// Verification cote serveur d'un token Cloudflare Turnstile.
//
// Appele depuis les Server Actions sensibles (createLead,
// submitProRegistration) + depuis le Credentials provider Auth.js
// (authorize callback). Pattern : si verify rate -> rejet du flow.
//
// Strategie dev sans keys :
//   - Si TURNSTILE_SECRET_KEY absent ET le token recu vaut "mock",
//     return success=true (workflow normal en dev local sans compte
//     Cloudflare).
//   - Si TURNSTILE_SECRET_KEY absent ET token != "mock", return
//     success=false (incite a configurer les keys ou utiliser "mock"
//     explicitement).
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

  // Dev sans keys : mock explicite uniquement.
  if (!secret) {
    if (token === "mock") {
      return { success: true };
    }
    console.warn(
      "[turnstile/verify] TURNSTILE_SECRET_KEY absent, token != 'mock' -> reject",
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
