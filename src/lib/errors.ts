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

