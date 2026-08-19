// Alerting ops — le canal des pannes qui doivent reveiller quelqu'un.
//
// Remplace Sentry, retire du projet le 19/08/2026 (hors scope, et un
// compte de plus a maintenir). Deux canaux, complementaires :
//
//   - `console.error` : la trace complete, lisible dans les logs Vercel.
//     C'est la qu'on debug apres coup — mais personne ne les ouvre
//     spontanement, donc ce canal seul equivaut au silence.
//   - heartbeat Better Stack : un POST sur `<URL>/fail` ouvre un incident
//     et declenche l'alerte (mail + telephone). C'est le seul canal *push*
//     du projet, et il est volontairement independant de Resend : la
//     saturation du quota email fait justement partie des pannes a
//     signaler.
//
// Deux niveaux, tranches au call site :
//
//   `reportIncident()` — quelque chose est casse et personne ne s'en
//     rendra compte autrement : argent encaisse sans credit, action admin
//     en echec, cron qui n'a pas fait son travail.
//   `console.error` seul — anormal, mais rattrape par le systeme lui-meme :
//     un pro saute son tour et la boucle continue, un navigateur refuse un
//     push, Stripe rejoue une signature invalide. Alerter dessus noierait
//     le canal, et un canal noye ne se lit plus.
//
// No-op si `BETTERSTACK_HEARTBEAT_URL` est absent (dev local, CI) — meme
// contrat que `lib/ratelimit.ts` et le sender Resend : le code metier
// appelle toujours, la config decide.

/** Valeurs jointes a un incident. Jamais de donnee personnelle : le corps
 *  du ping part chez un tiers, contrairement aux logs Vercel. */
export type IncidentContext = Record<
  string,
  string | number | boolean | null | undefined
>;

/** Un heartbeat n'est pas sur le chemin critique : on ne l'attend pas
 *  longtemps. Mieux vaut un incident rate qu'un webhook Stripe en timeout. */
const HEARTBEAT_TIMEOUT_MS = 3000;

/** Better Stack tronque de toute facon, et un corps enorme n'aide personne. */
const MAX_BODY_CHARS = 1000;

function heartbeatBaseUrl(): string | null {
  const url = process.env.BETTERSTACK_HEARTBEAT_URL?.trim();
  if (!url) return null;
  return url.replace(/\/+$/, "");
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`;
  }
  return String(error);
}

function formatBody(
  label: string,
  error: unknown,
  context: IncidentContext | undefined,
): string {
  const lines = [label];
  for (const [key, value] of Object.entries(context ?? {})) {
    if (value === undefined) continue;
    lines.push(`${key}=${String(value)}`);
  }
  if (error !== undefined) lines.push(describeError(error));
  return lines.join("\n").slice(0, MAX_BODY_CHARS);
}

async function ping(suffix: "" | "/fail", body: string): Promise<void> {
  const base = heartbeatBaseUrl();
  if (!base) return;
  try {
    await fetch(`${base}${suffix}`, {
      method: "POST",
      headers: { "content-type": "text/plain; charset=utf-8" },
      // Better Stack affiche le corps du ping dans l'incident : c'est ce
      // qui evite d'avoir a ouvrir les logs Vercel pour savoir de quoi
      // il s'agit.
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(HEARTBEAT_TIMEOUT_MS),
    });
  } catch (err) {
    // Un heartbeat injoignable ne doit jamais casser l'appelant : au pire
    // Better Stack constatera l'absence de ping au run suivant.
    console.error("[alerting] ping heartbeat échoué", {
      suffix: suffix || "/",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Signale une panne : trace en console + incident Better Stack.
 *
 * A `await` systematiquement. Sur Vercel, la fonction gele des que la
 * reponse part : un `void reportIncident(...)` serait coupe avant que le
 * ping n'ait quitte la machine, c'est-a-dire exactement l'inverse du but
 * recherche.
 *
 * Ne throw jamais.
 */
export async function reportIncident(
  label: string,
  detail: { error?: unknown; context?: IncidentContext } = {},
): Promise<void> {
  const { error, context } = detail;
  console.error(`[incident/${label}]`, {
    ...(context ?? {}),
    ...(error === undefined ? {} : { error: describeError(error) }),
  });
  await ping("/fail", formatBody(label, error, context));
}

/**
 * Signale qu'un run de cron s'est termine proprement.
 *
 * Better Stack attend ce ping a intervalle regulier ; son absence ouvre un
 * incident. Ce seul signal couvre trois pannes que le monitoring de la
 * page d'accueil ne voit pas : base de donnees en pause (quota Neon),
 * projet Vercel bloque pour impaye, et cron casse par un deploiement.
 *
 * A n'appeler que si le run n'a rien signale : pinguer apres un
 * `reportIncident` refermerait l'incident qu'on vient d'ouvrir.
 */
export async function pingCronHeartbeat(): Promise<void> {
  await ping("", "ok");
}
