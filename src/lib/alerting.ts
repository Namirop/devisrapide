// Alerting : trace complète en `console.error` (logs Vercel) + heartbeat
// Better Stack, où `<URL>/fail` ouvre un incident. Canal indépendant de Resend
// pour pouvoir signaler aussi un quota e-mail saturé.
// `reportIncident()` est réservé aux pannes invisibles autrement (paiement non
// crédité, action admin en échec, cron) ; ce que le système absorbe reste en
// `console.error`. No-op sans `BETTERSTACK_HEARTBEAT_URL` (dev local, CI).

/** Jamais de donnée personnelle : le corps du ping part chez un tiers. */
export type IncidentContext = Record<
  string,
  string | number | boolean | null | undefined
>;

/** Court : mieux vaut un incident raté qu'un webhook Stripe en timeout. */
const HEARTBEAT_TIMEOUT_MS = 3000;

const MAX_BODY_CHARS = 1000;

/** URLs séparées par des virgules : un heartbeat par destinataire d'alerte. */
function heartbeatBaseUrls(): string[] {
  return (process.env.BETTERSTACK_HEARTBEAT_URL ?? "")
    .split(",")
    .map((url) => url.trim().replace(/\/+$/, ""))
    .filter(Boolean);
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
  const bases = heartbeatBaseUrls();
  if (bases.length === 0) return;

  await Promise.allSettled(
    bases.map(async (base) => {
      try {
        await fetch(`${base}${suffix}`, {
          method: "POST",
          headers: { "content-type": "text/plain; charset=utf-8" },
          body,
          cache: "no-store",
          signal: AbortSignal.timeout(HEARTBEAT_TIMEOUT_MS),
        });
      } catch (err) {
        // Ne jamais casser l'appelant pour un heartbeat injoignable.
        console.error("[alerting] ping heartbeat échoué", {
          suffix: suffix || "/",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }),
  );
}

/**
 * Signale une panne (console + incident Better Stack). Ne lève jamais.
 * Toujours `await` : sur Vercel, un appel en `void` serait coupé au gel de
 * l'instance, avant l'envoi du ping.
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
 * Signale un run de cron réussi ; l'absence de ping ouvre un incident (base
 * en pause, projet suspendu, cron cassé). À n'appeler que si le run n'a rien
 * signalé : pinguer après `reportIncident` refermerait l'incident.
 */
export async function pingCronHeartbeat(): Promise<void> {
  await ping("", "ok");
}
