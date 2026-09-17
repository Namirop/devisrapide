// URL publique absolue (liens des emails, metadataBase). Domaine de production
// en dur : un oubli de variable d'environnement ne doit jamais faire pointer
// emails et og:image vers localhost. www. car l'apex redirige vers www.
const CANONICAL_PRODUCTION_URL = "https://www.devisrapide.be";

/** NEXTAUTH_URL, sinon domaine canonique en prod, URL de preview, localhost. */
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
