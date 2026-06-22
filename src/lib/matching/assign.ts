import { getAppConfig } from "@/lib/config";
import {
  buildProAssignmentUrl,
  buildProMesDemandesUrl,
  buildWalletUrl,
  urgencyLabel,
} from "@/lib/email/helpers";
import {
  sendLeadAcceptedProEmail,
  sendLowBalanceEmail,
  sendNewLeadProEmail,
} from "@/lib/email/sender";
import { prisma } from "@/lib/prisma";
import { sendPushToProfile } from "@/lib/push/send";
import {
  WALLET_LOW_BALANCE_THRESHOLD_CENTS,
  WalletInsufficientFundsError,
  debitWalletForLead,
} from "@/lib/wallet/debit";

import type { MatchablePro } from "./find-pros";

/**
 * Crée les `LeadAssignment` pour les pros matches sur un lead.
 *
 * Pour chaque pro fourni :
 * 1. Verifie le lock : si le lead a deja atteint le max d'acceptations
 *    (1 si exclusif, sinon `SHARED_LEAD_MAX_ACCEPTANCES`), STOP et
 *    n'assigne plus.
 * 2. Cree un `LeadAssignment` en PENDING avec `priceCents` (selon
 *    `lead.isExclusive`), `radiusKmAtAssignment`, et `expiresAt = now +
 *    RESPONSE_DELAY_MINUTES`.
 * 3. Si le pro a `autoAccept = true` ET un wallet suffisant :
 *    - Bascule l'assignment en ACCEPTED dans une transaction
 *      Serializable.
 *    - Debit le wallet via `debitWalletForLead`.
 *    - Si l'auto-accept echoue (wallet finalement insuffisant a cause
 *      d'une concurrence), l'assignment reste en PENDING (le pro pourra
 *      l'accepter manuellement apres recharge).
 *
 * Les emails sont envoyes par les Server Actions appelantes :
 *   - newLead email : envoye dans le matching d'origine cote createLead
 *   - leadAccepted email : envoye dans acceptLeadAssignment apres debit
 *
 * @param input.leadId    id du Lead a assigner
 * @param input.pros      liste des pros matches (cf. `findMatchingPros`)
 * @param input.radiusKm  rayon utilise pour cette passe (-1 pour OPEN)
 * @returns               nombre d'assignments crees (utile pour le caller)
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
          category: { select: { name: true } },
        },
      },
    },
  });
  if (!lead) throw new Error(`Lead introuvable: ${leadId}`);

  // Pre-charge les pros (user.email) pour pouvoir router l'email vers
  // le bon destinataire — la table ProProfile n'a pas l'email, c'est sur User.
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
  const responseDelayMin = await getAppConfig("RESPONSE_DELAY_MINUTES", "int");

  let created = 0;

  for (const pro of pros) {
    // ── Lock cap : recompter a chaque iteration pour reagir aux
    // acceptations qui auraient eu lieu pendant cette passe (auto-accept
    // ou acceptation manuelle externe). Pas de race au sein de cette
    // boucle (sequentielle), mais protege des passes paralleles (cron).
    const acceptedCount = await prisma.leadAssignment.count({
      where: { leadId, status: "ACCEPTED" },
    });
    if (acceptedCount >= maxAcceptances) {
      break;
    }

    const expiresAt = new Date(Date.now() + responseDelayMin * 60 * 1000);
    const shouldAutoAccept =
      pro.autoAccept && pro.walletBalanceCents >= priceCents;

    // Master-switch notifyByEmail respecte par sendEmailToProfile via
    // deliver() avec requiresOptIn. On passe juste l'email (s'il existe)
    // et la valeur du switch — pas de pre-filtre ici.
    const proEmail = proEmailByProfileId.get(pro.id);

    let assignmentId: string | null = null;
    let finalStatus: "ACCEPTED" | "PENDING" = "PENDING";
    // Hoist pour usage post-bloc auto-accept (push "wallet faible").
    let autoAcceptDebit: {
      balanceBeforeCents: number;
      balanceAfterCents: number;
    } | null = null;

    if (shouldAutoAccept) {
      // ── Auto-accept : assignment ACCEPTED + debit wallet en une
      // transaction Serializable. Si le wallet est concurremment vide
      // (autre acceptation simultanee), on attrape l'erreur et on
      // retombe en PENDING.
      try {
        const result = await prisma.$transaction(
          async (tx) => {
            const assignment = await tx.leadAssignment.create({
              data: {
                leadId,
                proProfileId: pro.id,
                proUserId: pro.userId,
                priceCents,
                isExclusive: lead.isExclusive,
                radiusKmAtAssignment: radiusKm,
                status: "ACCEPTED",
                acceptedAt: new Date(),
                expiresAt,
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
            return { assignmentId: assignment.id, debit };
          },
          { isolationLevel: "Serializable" },
        );
        assignmentId = result.assignmentId;
        autoAcceptDebit = result.debit;
        finalStatus = "ACCEPTED";
        created++;
      } catch (err) {
        if (err instanceof WalletInsufficientFundsError) {
          // Fallback PENDING : le pro pourra accepter apres recharge.
          const pendingAssignment = await prisma.leadAssignment.create({
            data: {
              leadId,
              proProfileId: pro.id,
              proUserId: pro.userId,
              priceCents,
              isExclusive: lead.isExclusive,
              radiusKmAtAssignment: radiusKm,
              status: "PENDING",
              expiresAt,
            },
            select: { id: true },
          });
          assignmentId = pendingAssignment.id;
          finalStatus = "PENDING";
          created++;
        } else {
          throw err;
        }
      }
    } else {
      // ── PENDING simple.
      const pendingAssignment = await prisma.leadAssignment.create({
        data: {
          leadId,
          proProfileId: pro.id,
          proUserId: pro.userId,
          priceCents,
          isExclusive: lead.isExclusive,
          radiusKmAtAssignment: radiusKm,
          status: "PENDING",
          expiresAt,
        },
        select: { id: true },
      });
      assignmentId = pendingAssignment.id;
      finalStatus = "PENDING";
      created++;
    }

    await prisma.proProfile.update({
      where: { id: pro.id },
      data: { lastLeadReceivedAt: new Date() },
    });

    // ── Emails (fire-and-forget) ─────────────────────────────
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

    // ── Push notification "nouveau lead" (PENDING uniquement,
    //    fire-and-forget). Pour les ACCEPTED (auto-accept), le pro est
    //    deja informe par sendLeadAcceptedProEmail. Master-switch
    //    notifyByPush + cleanup dead subs centralises dans
    //    sendPushToProfile. Pas d'await bloquant : la lib resoud meme
    //    en cas d'echec mais on protege par .catch defensif au cas ou.
    if (finalStatus === "PENDING" && assignmentId) {
      // Wording : titre + corps avec urgence et extrait projet.
      // Description tronquee a ~60 caracteres pour rester lisible dans
      // la card de notif systeme (titre = 1 ligne, body = 2-3 lignes max
      // sur la plupart des plateformes).
      const projectShort =
        lead.description.length > 60
          ? `${lead.description.slice(0, 60).trim()}…`
          : lead.description;
      void sendPushToProfile(pro.id, {
        title: `🚨 NOUVEAU LEAD : ${lead.subCategory.category.name} à ${lead.city} !`,
        body: `Urgence : ${urgencyLabel(lead.urgency)}. Projet : ${projectShort}. Cliquez pour voir et accepter !`,
        url: `/dashboard/leads/${assignmentId}`,
        tag: `new-lead-${leadId}`,
      }).catch(() => {});
    }

    // ── Push notification "auto-accept declenche".
    //    finalStatus === "ACCEPTED" dans assign.ts ne peut venir QUE
    //    du chemin auto-accept (la branche manuelle ne passe pas par
    //    ici), donc condition simple. Pas de push parallele "succes
    //    achat" V1 : F est email-seulement (email LeadAccepted
    //    deja envoye juste au-dessus). URL pointe sur la page de detail
    //    /dashboard/mes-demandes/[id] = vue post-acceptation avec coords
    //    client visibles.
    if (finalStatus === "ACCEPTED" && assignmentId) {
      void sendPushToProfile(pro.id, {
        title: "⚡ Auto-Accept activé !",
        body: "Un lead vient de vous être attribué automatiquement selon vos critères. Contactez le client sans attendre !",
        url: `/dashboard/mes-demandes/${assignmentId}`,
        tag: `auto-accept-${leadId}`,
      }).catch(() => {});
    }

    // ── Push notification "wallet faible" (auto-accept uniquement,
    //    au franchissement du seuil). Distinct du push "nouveau lead"
    //    quand un auto-accept fait franchir le seuil : 2 notifs separees
    //    avec tags differents (pas de merge).
    if (
      autoAcceptDebit &&
      autoAcceptDebit.balanceBeforeCents >= WALLET_LOW_BALANCE_THRESHOLD_CENTS &&
      autoAcceptDebit.balanceAfterCents < WALLET_LOW_BALANCE_THRESHOLD_CENTS
    ) {
      const balanceAfterCents = autoAcceptDebit.balanceAfterCents;
      void sendPushToProfile(pro.id, {
        title: "⚠️ Attention : solde bientôt vide",
        body: `Il ne vous reste que ${Math.round(balanceAfterCents / 100)}€ de crédits. Rechargez pour ne pas rater les prochains chantiers.`,
        url: "/dashboard/wallet",
        tag: `wallet-low-${pro.id}`,
      }).catch(() => {});
      // Email solde faible : pendant email du push, opt-in (respecte
      // notifyByEmail). Fire-and-forget.
      if (proEmail) {
        void sendLowBalanceEmail({
          to: proEmail,
          notifyByEmail: pro.notifyByEmail,
          companyName: pro.companyName,
          balanceCents: balanceAfterCents,
          walletUrl: buildWalletUrl(),
        }).catch(() => {});
      }
    }
  }

  if (created > 0) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { matchAttempts: { increment: created } },
    });
  }

  return created;
}
