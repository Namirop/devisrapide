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

  // ─── Pro : redirects selon role + validationStatus ────────────────
  // Match strict /pro et /pro/... uniquement — pas /pros (landing publique
  // artisan), /pros/... ni autres. startsWith("/pro") matche les deux,
  // bug pre-existant qui rendait /pros inaccessible sans login.
  if (pathname === "/pro" || pathname.startsWith("/pro/")) {
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
    return NextResponse.next();
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
