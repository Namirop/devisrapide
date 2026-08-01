// URL publique absolue du site, source unique pour tout ce qui doit sortir
// du navigateur : liens des emails transactionnels et metadataBase (og:image,
// canonical).
//
// Le domaine de production est ecrit en dur volontairement. La resolution ne
// tenait qu'a NEXTAUTH_URL, avec `?? "http://localhost:3000"` en filet : la
// variable a manque en prod et TOUS les emails envoyes ont pointe vers
// localhost, og:image compris (apercus de lien casses sur les reseaux). Un
// oubli de variable d'environnement ne doit pas pouvoir reproduire ca.
//
// www. et pas l'apex : devisrapide.be redirige en 307 vers www.devisrapide.be.
const CANONICAL_PRODUCTION_URL = "https://www.devisrapide.be";

/**
 * Ordre de resolution :
 * 1. NEXTAUTH_URL — override explicite, prioritaire partout (dev, staging).
 * 2. Production Vercel — domaine canonique en dur, jamais localhost.
 * 3. VERCEL_URL — deploiement de preview, URL generee par deploiement.
 * 4. localhost — dev local uniquement.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXTAUTH_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);

  if (process.env.VERCEL_ENV === "production") return CANONICAL_PRODUCTION_URL;

  const previewUrl = process.env.VERCEL_URL?.trim();
  if (previewUrl) return `https://${stripTrailingSlash(previewUrl)}`;

  return "http://localhost:3000";
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export const SITE_URL = resolveSiteUrl();
