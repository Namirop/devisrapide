import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";

import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // ─── Launch protection : verrou Basic Auth global (avant tout) ────
  // Masque le site au public jusqu'au launch officiel. Desactive par
  // defaut : no-op total tant que LAUNCH_PROTECT_ENABLED !== "true".
  // S'execute EN TETE pour court-circuiter toute autre logique (cron,
  // admin, dashboard) des que le verrou rejette.
  const launchGate = enforceLaunchProtection(req);
  if (launchGate) return launchGate;

  // ─── Cron : auth par bearer token ────────────────────────────────
  if (pathname.startsWith("/api/cron/")) {
    const expected = process.env.CRON_SECRET;
    const provided = req.headers.get("authorization");
    if (!expected || provided !== `Bearer ${expected}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return NextResponse.next();
  }

  const session = req.auth;

  // ─── Admin : auth hybride (Sprint 4) ──────────────────────────────
  // - Anonyme → redirect /connexion avec callbackUrl sanitized
  //   (preserve l'intention de l'admin qui clique un lien /admin/* sans
  //   etre connecte).
  // - Connecte mais role !== ADMIN → 404 rewrite silencieux + log
  //   console.warn pour detection abuse (un PRO qui tente /admin doit
  //   etre repere sans alerter le user qu'il a touche une zone protegee).
  // - Connecte + ADMIN → autorise.
  //
  // /404-not-found existe (route stub avec notFound()) et sert le
  // not-found.tsx du root → reponse identique au vrai 404 du site.
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const callbackUrl = pathname + nextUrl.search;
      const safeCb = isSafeCallback(callbackUrl) ? callbackUrl : "/admin";
      const url = new URL("/connexion", nextUrl);
      url.searchParams.set("callbackUrl", safeCb);
      return NextResponse.redirect(url);
    }
    if (session.user.role !== "ADMIN") {
      console.warn("[proxy/admin] non-admin access attempt", {
        userId: session.user.id,
        role: session.user.role,
        attemptedPath: pathname,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.rewrite(new URL("/404-not-found", nextUrl));
    }
    // Le layout admin lit le pathname pour decider si la TopBar affiche
    // le greeting (home /admin) ou la version compacte (meme pattern que
    // le dashboard pro).
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ─── Dashboard pro : redirects selon role + validationStatus ──────
  // Sprint 2b : l'espace pro a migre de /pro/* vers /dashboard/*. Le
  // matcher ci-dessous s'applique uniquement aux routes dashboard.
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    if (!session) {
      const url = new URL("/connexion", nextUrl);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (session.user.role !== "PRO") {
      return NextResponse.redirect(new URL("/connexion", nextUrl));
    }
    const status = session.user.validationStatus;
    if (status === "PENDING") {
      return NextResponse.redirect(
        new URL("/inscription-pro/en-attente", nextUrl),
      );
    }
    if (status === "SUSPENDED") {
      return NextResponse.redirect(new URL("/compte-suspendu", nextUrl));
    }
    if (status === "REJECTED") {
      return NextResponse.redirect(new URL("/compte-refuse", nextUrl));
    }
    if (status !== "VALIDATED") {
      return NextResponse.redirect(new URL("/connexion", nextUrl));
    }
    // Le layout dashboard a besoin de connaitre le pathname pour decider
    // si la TopBar doit afficher la version greeting (home) ou compacte.
    // On le passe via header de requete (lu cote layout via headers()).
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
});

/**
 * Valide qu'un callbackUrl provenant d'une URL utilisateur est safe a
 * passer a /connexion. On veut un path interne uniquement :
 * - Doit commencer par "/" (path absolu).
 * - Pas "//" (protocol-relative externe : //evil.com/path).
 * - Pas "\\" (backslash trick navigateurs anciens : \\evil.com).
 * - Pas ":" (protocoles : javascript:..., data:..., http:...).
 * - Pas "\" (defense en profondeur, certains parsers les acceptent).
 *
 * En pratique le pathname vient de req.nextUrl (sanitized par Next) donc
 * pas d'input user direct, mais on garde le guard pour defense en
 * profondeur.
 */
function isSafeCallback(url: string): boolean {
  return (
    url.startsWith("/") &&
    !url.startsWith("//") &&
    !url.startsWith("\\") &&
    !url.includes(":") &&
    !url.includes("\\")
  );
}

/**
 * Verrou « launch protection » : exige une auth HTTP Basic sur tout le
 * site tant qu'on n'a pas lance officiellement.
 *
 * - Desactive (LAUNCH_PROTECT_ENABLED !== "true") → null, site public.
 * - Actif → 401 + WWW-Authenticate (popup navigateur) tant qu'un header
 *   Basic valide n'est pas presente, SAUF sur les routes exemptees.
 *
 * Les assets statiques (/_next, /favicon.ico, *.png, /sw.js,
 * /manifest.webmanifest, /api/auth/*...) n'atteignent jamais ce code :
 * ils sont exclus en amont par `config.matcher` (motif `.*\..*` +
 * exclusions nommees), donc jamais soumis au verrou.
 *
 * Toggle sans redeploy de code : on change la var d'env sur Vercel +
 * redeploy. Au launch → LAUNCH_PROTECT_ENABLED=false (ou suppression).
 */
function enforceLaunchProtection(req: NextRequest): NextResponse | null {
  if (process.env.LAUNCH_PROTECT_ENABLED !== "true") return null;
  if (isLaunchProtectExempt(req.nextUrl.pathname)) return null;

  const authorization = req.headers.get("authorization");
  if (authorization && isValidBasicAuth(authorization)) return null;

  return new NextResponse("Authentification requise", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="DevisRapide", charset="UTF-8"',
    },
  });
}

/**
 * Endpoints techniques toujours publics meme verrou actif : appeles par
 * des systemes externes/automatiques qui ne presentent pas de creds Basic
 * et disposent de leur propre securite (signature Stripe, CRON_SECRET).
 */
function isLaunchProtectExempt(pathname: string): boolean {
  return pathname === "/api/stripe/webhook" || pathname.startsWith("/api/cron/");
}

/**
 * Valide un header `Authorization: Basic base64(user:pass)` contre les
 * creds d'env. Fail-closed : verrou actif mais USERNAME/PASSWORD non
 * configures → on refuse tout (un site cense etre masque ne doit pas
 * s'ouvrir par simple oubli de config).
 */
function isValidBasicAuth(authorization: string): boolean {
  const expectedUser = process.env.LAUNCH_PROTECT_USERNAME;
  const expectedPass = process.env.LAUNCH_PROTECT_PASSWORD;
  if (!expectedUser || !expectedPass) {
    console.warn(
      "[proxy/launch-protect] LAUNCH_PROTECT_ENABLED=true mais " +
        "USERNAME/PASSWORD manquant — acces bloque (fail-closed).",
    );
    return false;
  }

  const [scheme, encoded] = authorization.split(" ");
  if (scheme !== "Basic" || !encoded) return false;

  let decoded: string;
  try {
    decoded = atob(encoded);
  } catch {
    return false;
  }

  // Le mot de passe peut contenir des ":" → on coupe sur le premier.
  const separator = decoded.indexOf(":");
  if (separator === -1) return false;

  return (
    decoded.slice(0, separator) === expectedUser &&
    decoded.slice(separator + 1) === expectedPass
  );
}

export const config = {
  matcher: [
    // Tout sauf : assets statiques, _next, favicon, fichiers publics, et /api/auth.
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\..*).*)",
    "/api/cron/:path*",
  ],
};
