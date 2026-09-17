import { NextResponse, type NextRequest } from "next/server";

import { signOut } from "@/lib/auth";

/**
 * Détruit une session dont le jeton contredit la base (cf.
 * lib/session-reset.ts). Route Handler, car un Server Component ne peut pas
 * écrire de cookie pendant le rendu : c'est la suppression du cookie par
 * signOut() qui casse la boucle de redirection. GET, car cible d'une
 * redirection ; un abus CSRF se limite à une déconnexion forcée.
 */
export async function GET(req: NextRequest) {
  const raison = req.nextUrl.searchParams.get("raison") ?? "inconnue";
  console.warn("[deconnexion] session incoherente detruite", { raison });

  await signOut({ redirect: false });

  return NextResponse.redirect(
    new URL("/connexion?error=session", req.nextUrl),
  );
}
