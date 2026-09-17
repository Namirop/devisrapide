import { afterResponse } from "@/lib/after-response";
import { getAppConfig } from "@/lib/config";
import {
  buildProAssignmentUrl,
  buildProMesDemandesUrl,
  urgencyLabel,
} from "@/lib/email/helpers";
import {
  sendLeadAcceptedProEmail,
  sendNewLeadProEmail,
} from "@/lib/email/sender";
import { maskContactDetails } from "@/lib/mask-contact";
import {
  notifyLeadNoLongerAvailable,
  notifyLowBalanceIfCrossed,
} from "@/lib/notifications/lead-purchase";
import { prisma } from "@/lib/prisma";
import { sendPushToProfile } from "@/lib/push/send";
import { runSerializable } from "@/lib/serializable-tx";
import {
  WalletInsufficientFundsError,
  debitWalletForLead,
} from "@/lib/wallet/debit";

import { closeLeadIfFull } from "./close-lead";
import { shouldAutoAcceptLead } from "./eligibility";
import type { MatchablePro } from "./find-pros";

/**
 * Crée les `LeadAssignment` des pros matchés, dans l'ordre reçu, tant que le
 * lead a de la place, puis notifie chaque pro (e-mail, push). Auto-accept :
 * création ACCEPTED, débit et fermeture éventuelle du lead dans une même
 * transaction Serializable ; si le solde ne suit plus, repli en PENDING.
 *
 * @returns le nombre d'assignments créés.
 */
export async function assignLeadToPros(input: {
  leadId: string;
  pros: MatchablePro[];
  radiusKm: number;
}): Promise<number> {
  const { leadId, pros, radiusKm } = input;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      isExclusive: true,
      expiresAt: true,
      sharedLeadPriceCentsSnapshot: true,
      exclusiveLeadPriceCentsSnapshot: true,
      clientFirstName: true,
      clientLastName: true,
      clientEmail: true,
      clientPhone: true,
      urgency: true,
      postalCode: true,
      city: true,
      address: true,
      description: true,
      subCategory: {
        select: {
          name: true,
          category: { select: { name: true, isCatchAll: true } },
        },
      },
    },
  });
  if (!lead) throw new Error(`Lead introuvable: ${leadId}`);

  // L'e-mail est porté par User, pas par ProProfile.
  const proEmailByProfileId = new Map<string, string>();
  if (pros.length > 0) {
    const proUsers = await prisma.user.findMany({
      where: { id: { in: pros.map((p) => p.userId) } },
      select: { id: true, email: true },
    });
    const emailByUserId = new Map(proUsers.map((u) => [u.id, u.email]));
    for (const pro of pros) {
      const email = emailByUserId.get(pro.userId);
      if (email) proEmailByProfileId.set(pro.id, email);
    }
  }

  const priceCents = lead.isExclusive
    ? lead.exclusiveLeadPriceCentsSnapshot
    : lead.sharedLeadPriceCentsSnapshot;

  const maxAcceptances = lead.isExclusive
    ? 1
    : await getAppConfig("SHARED_LEAD_MAX_ACCEPTANCES", "int");

  // Le pro a toute la durée de vie du lead pour répondre : sur chantier la
  // journée, il doit encore trouver l'opportunité le soir. Repli défensif :
  // `expiresAt` est nullable au schéma, bien que `createLead` le pose.
  const globalTimeoutHours = await getAppConfig(
    "LEAD_GLOBAL_TIMEOUT_HOURS",
    "int",
  );
  const expiresAt =
    lead.expiresAt ?? new Date(Date.now() + globalTimeoutHours * 3600 * 1000);

  let created = 0;
  let skipped = 0;

  for (const pro of pros) {
    // Recompté à chaque pro : un auto-accept de cette boucle ou un achat
    // manuel concurrent peut avoir rempli le lead entre-temps.
    const acceptedCount = await prisma.leadAssignment.count({
      where: { leadId, status: "ACCEPTED" },
    });
    if (acceptedCount >= maxAcceptances) {
      break;
    }

    const shouldAutoAccept = shouldAutoAcceptLead({
      proAutoAccept: pro.autoAccept,
      proBalanceCents: pro.walletBalanceCents,
      priceCents,
      isCatchAllCategory: lead.subCategory.category.isCatchAll,
    });

    // L'opt-in `notifyByEmail` est appliqué par `deliver()` (requiresOptIn).
    const proEmail = proEmailByProfileId.get(pro.id);

    const baseData = {
      leadId,
      proProfileId: pro.id,
      proUserId: pro.userId,
      priceCents,
      isExclusive: lead.isExclusive,
      radiusKmAtAssignment: radiusKm,
      expiresAt,
    };
    const createPendingAssignment = () =>
      prisma.leadAssignment.create({
        data: { ...baseData, status: "PENDING" as const },
        select: { id: true },
      });

    let assignmentId: string | null = null;
    let finalStatus: "ACCEPTED" | "PENDING" = "PENDING";
    let autoAcceptDebit: {
      balanceBeforeCents: number;
      balanceAfterCents: number;
    } | null = null;
    // Pros évincés si cet auto-accept remplit le lead, notifiés après commit.
    let closedProProfileIds: ReadonlyArray<string> = [];

    try {
      if (shouldAutoAccept) {
        try {
          const result = await runSerializable(
            "assignLeadToPros/autoAccept",
            async (tx) => {
              const assignment = await tx.leadAssignment.create({
                data: {
                  ...baseData,
                  status: "ACCEPTED",
                  acceptedAt: new Date(),
                },
                select: { id: true },
              });
              const debit = await debitWalletForLead({
                tx,
                proProfileId: pro.id,
                proUserId: pro.userId,
                amountCents: priceCents,
                leadAssignmentId: assignment.id,
                description: "Auto-accept lead",
              });
              // Ferme le lead comme un achat manuel : les pros assignés plus
              // tôt dans la boucle ne doivent pas le voir encore achetable.
              const closed = await closeLeadIfFull({
                tx,
                leadId,
                maxAcceptances,
                keepAssignmentId: assignment.id,
              });
              return { assignmentId: assignment.id, debit, closed };
            },
          );
          assignmentId = result.assignmentId;
          autoAcceptDebit = result.debit;
          closedProProfileIds = result.closed;
          finalStatus = "ACCEPTED";
          created++;
        } catch (err) {
          if (err instanceof WalletInsufficientFundsError) {
            // Solde vidé entre-temps : PENDING, achat possible après recharge.
            const pendingAssignment = await createPendingAssignment();
            assignmentId = pendingAssignment.id;
            finalStatus = "PENDING";
            created++;
          } else {
            throw err;
          }
        }
      } else {
        const pendingAssignment = await createPendingAssignment();
        assignmentId = pendingAssignment.id;
        finalStatus = "PENDING";
        created++;
      }
    } catch (err) {
      // Un pro en échec ne prive pas les suivants (ex. conflit d'unicité
      // [leadId, proProfileId] entre deux passes, reprises épuisées).
      console.error("[matching/assign] pro skipped", {
        leadId,
        proProfileId: pro.id,
        error: err instanceof Error ? err.message : String(err),
      });
      skipped++;
      continue;
    }

    // Non bloquant : ne sert qu'à la rotation équitable des prochains leads.
    try {
      await prisma.proProfile.update({
        where: { id: pro.id },
        data: { lastLeadReceivedAt: new Date() },
      });
    } catch (err) {
      console.error("[matching/assign] lastLeadReceivedAt update failed", {
        proProfileId: pro.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // E-mails attendus (deliver() ne lève jamais). Limite connue : N pros =
    // N appels Resend en série dans la requête ; à passer en job de fond si
    // le nombre de pros par lead augmente.
    if (proEmail && assignmentId) {
      if (finalStatus === "ACCEPTED") {
        await sendLeadAcceptedProEmail({
          to: proEmail,
          notifyByEmail: pro.notifyByEmail,
          companyName: pro.companyName,
          clientFirstName: lead.clientFirstName,
          clientLastName: lead.clientLastName,
          clientEmail: lead.clientEmail,
          clientPhone: lead.clientPhone,
          categoryName: lead.subCategory.category.name,
          subCategoryName: lead.subCategory.name,
          urgencyLabel: urgencyLabel(lead.urgency),
          postalCode: lead.postalCode,
          city: lead.city,
          address: lead.address,
          description: lead.description,
          priceCents,
          assignmentUrl: buildProMesDemandesUrl(assignmentId),
        });
      } else {
        await sendNewLeadProEmail({
          to: proEmail,
          notifyByEmail: pro.notifyByEmail,
          clientFirstName: lead.clientFirstName,
          clientLastNameInitial: lead.clientLastName.charAt(0).toUpperCase(),
          categoryName: lead.subCategory.category.name,
          subCategoryName: lead.subCategory.name,
          urgencyLabel: urgencyLabel(lead.urgency),
          postalCode: lead.postalCode,
          city: lead.city,
          priceCents,
          assignmentUrl: buildProAssignmentUrl(assignmentId),
        });
      }
    }

    if (finalStatus === "PENDING" && assignmentId) {
      // Masquer avant de tronquer : le push part avant tout achat, et une
      // troncature préalable laisserait passer un début de numéro.
      const safeDescription = maskContactDetails(lead.description);
      const projectShort =
        safeDescription.length > 60
          ? `${safeDescription.slice(0, 60).trim()}…`
          : safeDescription;
      afterResponse("push/newLead", () =>
        sendPushToProfile(pro.id, {
          title: `🚨 NOUVEAU LEAD : ${lead.subCategory.category.name} à ${lead.city} !`,
          body: `Urgence : ${urgencyLabel(lead.urgency)}. Projet : ${projectShort}. Cliquez pour voir et accepter !`,
          url: `/dashboard/leads/${assignmentId}`,
          tag: `new-lead-${leadId}`,
        }),
      );
    }

    if (finalStatus === "ACCEPTED" && assignmentId) {
      afterResponse("push/autoAccept", () =>
        sendPushToProfile(pro.id, {
          title: "⚡ Auto-Accept activé !",
          body: "Un lead vient de vous être attribué automatiquement selon vos critères. Contactez le client sans attendre !",
          url: `/dashboard/mes-demandes/${assignmentId}`,
          tag: `auto-accept-${leadId}`,
        }),
      );
    }

    // Mêmes notifications que l'achat manuel (pros évincés, solde bas).
    notifyLeadNoLongerAvailable({
      proProfileIds: closedProProfileIds,
      leadId,
      city: lead.city,
    });

    if (autoAcceptDebit) {
      notifyLowBalanceIfCrossed({
        proProfileId: pro.id,
        proEmail,
        notifyByEmail: pro.notifyByEmail,
        companyName: pro.companyName,
        balanceBeforeCents: autoAcceptDebit.balanceBeforeCents,
        balanceAfterCents: autoAcceptDebit.balanceAfterCents,
      });
    }
  }

  if (skipped > 0) {
    console.warn("[matching/assign] pros skipped on this pass", {
      leadId,
      skipped,
      created,
    });
  }

  return created;
}
