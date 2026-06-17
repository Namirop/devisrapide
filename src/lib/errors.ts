/**
 * Erreurs metier typees pour les Server Actions.
 *
 * Pattern d'usage :
 *   - throw new ActionError("CODE", "Message lisible") dans un
 *     prisma.$transaction pour rollback + propagation propre.
 *   - catch en sortie pour mapper en Result type.
 *
 * Sous-set des codes : chaque action declare son union narrowee dans
 * son Result type (ex: "PRO_NOT_FOUND" | "ALREADY_ASSIGNED"). Le cast
 * `err.code as ...` est sur le call-site, justifie par la connaissance
 * locale des throws possibles dans la transaction.
 */

export type ActionErrorCode =
  | "LEAD_NOT_FOUND"
  | "LEAD_EXPIRED"
  | "PRO_NOT_FOUND"
  | "PRO_NOT_VALIDATED"
  | "ALREADY_ASSIGNED"
  | "ALREADY_PURCHASED"
  | "INSUFFICIENT_FUNDS"
  | "EMAIL_CONFLICT"
  | "VAT_CONFLICT";

export class ActionError extends Error {
  constructor(
    public readonly code: ActionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ActionError";
  }
}

export function isActionError(err: unknown): err is ActionError {
  return err instanceof ActionError;
}

/**
 * Map un conflit unique Prisma (P2002) vers une ActionError typee.
 * Retourne null si l'erreur n'est pas un P2002 ou si la cle conflictee
 * n'est pas dans le targetMap (le caller decide quoi faire — typiquement
 * re-throw l'erreur originale).
 *
 * @example
 *   try { await prisma.user.update(...); }
 *   catch (err) {
 *     const ae = mapPrismaError(err, {
 *       email: () => new ActionError("EMAIL_CONFLICT", "Email pris"),
 *       vatNumber: () => new ActionError("VAT_CONFLICT", "TVA prise"),
 *     });
 *     if (ae) throw ae;
 *     throw err;
 *   }
 */
export function mapPrismaError(
  err: unknown,
  targetMap: Record<string, () => ActionError>,
): ActionError | null {
  if (
    !(
      err instanceof Error &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    )
  ) {
    return null;
  }
  const target = (err as { meta?: { target?: string[] } }).meta?.target;
  if (!target || target.length === 0) return null;
  for (const key of target) {
    if (key in targetMap) {
      return targetMap[key]();
    }
  }
  return null;
}
