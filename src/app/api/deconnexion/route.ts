import { NextResponse, type NextRequest } from "next/server";

import { signOut } from "@/lib/auth";

/**
 * Destruction forcee de session, cible des gates qui detectent un jeton
 * incoherent avec la base (cf. lib/session-reset.ts pour le pourquoi).
 *
 * Route Handler et pas Server Component : ecrire un cookie pendant le
 * rendu d'un Server Component est interdit, et c'est precisement l'ecriture
 * du cookie (sa suppression) qui casse la boucle de redirection. Le
 * `cookies().set()` effectue par signOut() est fusionne par Next dans la
 * reponse renvoyee ici.
 *
 * GET assume : la cible d'une redirection ne peut pas etre un POST. Le
 * risque CSRF se limite a une deconnexion forcee — nuisance, pas faille.
 *
 * A ne pas confondre avec le bouton "Se deconnecter" de l'interface, qui
 * passe par signOut() cote client (UserMenu / AdminUserMenu).
 */
export async function GET(req: NextRequest) {
  const raison = req.nextUrl.searchParams.get("raison") ?? "inconnue";
  console.warn("[deconnexion] session incoherente detruite", { raison });

  await signOut({ redirect: false });

  return NextResponse.redirect(
    new URL("/connexion?error=session", req.nextUrl),
  );
}
