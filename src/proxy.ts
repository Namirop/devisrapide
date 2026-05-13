import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

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
    return NextResponse.next();
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
    if (status === "SUSPENDED" || status === "REJECTED") {
      return NextResponse.redirect(new URL("/compte-suspendu", nextUrl));
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

export const config = {
  matcher: [
    // Tout sauf : assets statiques, _next, favicon, fichiers publics, et /api/auth.
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\..*).*)",
    "/api/cron/:path*",
  ],
};
