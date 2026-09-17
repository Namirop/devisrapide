/**
 * Erreur métier des Server Actions : levée dans une `prisma.$transaction`
 * pour déclencher le rollback, puis convertie en Result par l'action, qui
 * restreint `code` aux valeurs qu'elle peut réellement lever.
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
