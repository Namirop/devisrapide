/**
 * Stub matching — Sprint 2 implémentera la vraie logique :
 * 1. round-robin EXCLUSIVE
 * 2. fan-out STANDARD/OFF (jusqu'à MAX_PROS_PER_SHARED_LEAD)
 * 3. notifications + état Lead/LeadAssignment
 * cf. docs/architecture.md §6.2
 */
export async function matchLead(leadId: string): Promise<void> {
  console.warn(`[matching] TODO Sprint 2: matching for lead ${leadId}`);
}
