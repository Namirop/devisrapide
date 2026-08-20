import { after } from "next/server";

/**
 * Execute un effet de bord non bloquant (e-mail, push) APRES la reponse,
 * en gardant l'instance serverless en vie jusqu'a la fin de la tache.
 *
 * Ce helper existe a cause d'une panne reelle : une candidature pro du
 * 16/08/2026 n'a jamais declenche son e-mail d'alerte a l'equipe. L'envoi
 * partait en `void sendX().catch(() => {})`, or sur Vercel l'instance gele
 * des que la reponse part — la requete HTTP vers Resend est restee
 * suspendue en plein vol, pour ne se resoudre qu'au reveil de l'instance
 * 34 s plus tard, sur la requete d'un autre visiteur, en
 * `application_error / statusCode: null`. Rien n'etait casse : le travail
 * avait simplement ete coupe au milieu, et une inscription sur deux
 * passait.
 *
 * `after()` confie la tache au `waitUntil` de la plateforme : l'appelant
 * repond aussi vite qu'avant, et le travail va au bout.
 *
 * Le catch vit ici et pas au call site : c'est le meme `.catch(() => {})`
 * recopie a douze endroits qui avait rendu ces echecs invisibles. Pas de
 * `reportIncident` en revanche — les envois d'e-mail alertent deja pour
 * leur propre compte dans `deliver()`, et un push refuse par un navigateur
 * est un incident que le systeme absorbe (cf. CLAUDE.md, tri de
 * l'alerting).
 */
export function afterResponse(
  label: string,
  task: () => Promise<unknown>,
): void {
  const run = async () => {
    try {
      await task();
    } catch (err) {
      console.error(`[afterResponse/${label}] échec`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  try {
    after(run);
  } catch {
    // `after()` exige un scope de requete et jette sinon. Tous les appels
    // du projet en ont un (Server Action ou Route Handler) ; si un futur
    // appelant n'en a pas, une notification perdue reste preferable a une
    // inscription ou un achat qui echoue.
    void run();
  }
}
