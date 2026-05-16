/**
 * Convertit une VAPID public key base64-url (envoyee par le serveur) en
 * Uint8Array exploitable par PushManager.subscribe({ applicationServerKey }).
 *
 * Base64-url = base64 standard avec '-' au lieu de '+', '_' au lieu de '/'
 * et sans padding '='. Spec : RFC 7515 (JOSE / JWS).
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}
