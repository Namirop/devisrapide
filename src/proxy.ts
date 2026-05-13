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

  // ─── Admin : 404 si non authentifie/non admin (on cache l'existence) ─
  if (pathname.startsWith("/admin")) {
    if (!session || session.user.role !== "ADMIN") {
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

export const config = {
  matcher: [
    // Tout sauf : assets statiques, _next, favicon, fichiers publics, et /api/auth.
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\..*).*)",
    "/api/cron/:path*",
  ],
};
