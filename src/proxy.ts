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
import { sessionResetUrl } from "@/lib/session-reset";

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Verrou de pré-lancement, évalué avant toute autre logique.
  const launchGate = await enforceLaunchProtection(req);
  if (launchGate) return launchGate;

  // Cron : authentification par bearer token.
  if (pathname.startsWith("/api/cron/")) {
    const expected = process.env.CRON_SECRET;
    const provided = req.headers.get("authorization");
    if (!expected || provided !== `Bearer ${expected}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return NextResponse.next();
  }

  const session = req.auth;

  // Admin : anonyme → /connexion avec callbackUrl assaini. Connecté non admin
  // → rewrite vers /404-not-found (réponse identique au vrai 404, la zone
  // reste invisible) et tentative journalisée.
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
    // Lu par le layout via headers() pour choisir la variante de TopBar.
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Dashboard pro : filtre session + rôle uniquement. Le proxy n'a que le JWT,
  // figé à la connexion ; le routage selon le statut de validation se fait
  // dans le layout dashboard, qui lit la base.
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    if (!session) {
      const url = new URL("/connexion", nextUrl);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (session.user.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", nextUrl));
    }
    // Rôle incohérent : détruire la session, sinon /connexion renverrait
    // ici en boucle (cf. lib/session-reset.ts).
    if (session.user.role !== "PRO") {
      return NextResponse.redirect(
        new URL(sessionResetUrl("role-inattendu"), nextUrl),
      );
    }
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
});

/**
 * Anti open redirect : chemin interne uniquement, sans `//hôte`, backslash
 * ni `:` (schémas `javascript:`, `data:`…).
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
 * Verrou de pré-lancement (`LAUNCH_PROTECT_ENABLED=true`) : sans cookie
 * valide, redirige vers la page de déverrouillage. Pas de 401 Basic Auth :
 * en PWA iOS standalone, WebKit ne réaffiche pas la popup et l'écran reste
 * bloqué. Les assets, exclus par `config.matcher`, n'arrivent pas ici.
 */
async function enforceLaunchProtection(
  req: NextRequest,
): Promise<NextResponse | null> {
  if (!isLaunchProtectEnabled()) return null;

  const { pathname } = req.nextUrl;
  if (isLaunchProtectExempt(pathname)) return null;

  const cookie = req.cookies.get(LAUNCH_COOKIE_NAME)?.value;
  if (await isValidLaunchCookie(cookie)) return null;

  const url = new URL(LAUNCH_UNLOCK_PATH, req.nextUrl);
  const intended = pathname + req.nextUrl.search;
  if (isSafeNext(intended)) {
    url.searchParams.set("next", intended);
  }
  return NextResponse.redirect(url);
}

/**
 * Exemptés : la page de déverrouillage (sinon boucle de redirection) et les
 * appels machine sécurisés autrement (signature Stripe, CRON_SECRET).
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
    // Hors assets, fichiers publics et routes d'auth. /api/deconnexion aussi :
    // le wrapper auth() réémettrait le cookie de session que la route efface.
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/deconnexion|.*\\..*).*)",
    "/api/cron/:path*",
  ],
};
