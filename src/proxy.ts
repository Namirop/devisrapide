import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";

import { authConfig } from "@/lib/auth.config";
import {
  LAUNCH_COOKIE_NAME,
  LAUNCH_UNLOCK_PATH,
  isLaunchProtectEnabled,
  isSafeNext,
  isValidLaunchCookie,
} from "@/lib/launch-protect";

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // ─── Launch protection : verrou Basic Auth global (avant tout) ────
  // Masque le site au public jusqu'au launch officiel. Desactive par
  // defaut : no-op total tant que LAUNCH_PROTECT_ENABLED !== "true".
  // S'execute EN TETE pour court-circuiter toute autre logique (cron,
  // admin, dashboard) des que le verrou rejette.
  const launchGate = await enforceLaunchProtection(req);
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
 * Verrou « launch protection » : masque le site au public tant qu'on n'a
 * pas lance officiellement.
 *
 * - Desactive (LAUNCH_PROTECT_ENABLED !== "true") → null, site public.
 * - Actif → si pas de cookie de deverrouillage valide, REDIRIGE vers la
 *   page /acces (qui pose le cookie apres saisie des identifiants), SAUF
 *   sur les routes exemptees.
 *
 * On NE renvoie PAS de 401 Basic Auth : casse en PWA iOS standalone (WebKit
 * n'y reaffiche pas la popup de saisie au relancement → ecran 401 bloque
 * sans champ). Une redirection + page HTML + cookie persistant marche sur
 * toutes les plateformes. Detail du mecanisme dans `lib/launch-protect.ts`.
 *
 * Les assets statiques (/_next, /favicon.ico, *.png, /sw.js,
 * /manifest.webmanifest, /api/auth/*...) n'atteignent jamais ce code : ils
 * sont exclus en amont par `config.matcher` (motif `.*\..*` + exclusions
 * nommees), donc jamais soumis au verrou.
 *
 * Toggle sans redeploy de code : on change la var d'env sur Vercel +
 * redeploy. Au launch → LAUNCH_PROTECT_ENABLED=false (ou suppression).
 */
async function enforceLaunchProtection(
  req: NextRequest,
): Promise<NextResponse | null> {
  if (!isLaunchProtectEnabled()) return null;

  const { pathname } = req.nextUrl;
  if (isLaunchProtectExempt(pathname)) return null;

  const cookie = req.cookies.get(LAUNCH_COOKIE_NAME)?.value;
  if (await isValidLaunchCookie(cookie)) return null;

  // Pas de cookie valide → page de deverrouillage. On preserve la
  // destination via ?next pour y revenir apres unlock.
  const url = new URL(LAUNCH_UNLOCK_PATH, req.nextUrl);
  const intended = pathname + req.nextUrl.search;
  if (isSafeNext(intended)) {
    url.searchParams.set("next", intended);
  }
  return NextResponse.redirect(url);
}

/**
 * Routes toujours accessibles meme verrou actif :
 * - la page de deverrouillage elle-meme (sinon boucle de redirection ; sa
 *   Server Action POST cible aussi /acces) ;
 * - les endpoints techniques appeles par des systemes externes qui ne
 *   presentent pas le cookie et ont leur propre securite (signature Stripe,
 *   CRON_SECRET).
 */
function isLaunchProtectExempt(pathname: string): boolean {
  return (
    pathname === LAUNCH_UNLOCK_PATH ||
    pathname === "/api/stripe/webhook" ||
    pathname.startsWith("/api/cron/")
  );
}

export const config = {
  matcher: [
    // Tout sauf : assets statiques, _next, favicon, fichiers publics, et /api/auth.
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\..*).*)",
    "/api/cron/:path*",
  ],
};
