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
import type { MatchablePro } from "./find-pros";

/**
 * Crée les `LeadAssignment` pour les pros matches sur un lead.
 *
 * Pour chaque pro fourni :
 * 1. Verifie le lock : si le lead a deja atteint le max d'acceptations
 *    (1 si exclusif, sinon `SHARED_LEAD_MAX_ACCEPTANCES`), STOP et
 *    n'assigne plus.
 * 2. Cree un `LeadAssignment` en PENDING avec `priceCents` (selon
 *    `lead.isExclusive`), `radiusKmAtAssignment`, et `expiresAt =
 *    lead.expiresAt` (le pro a toute la duree de vie du lead pour
 *    repondre, cf. commentaire sur `expiresAt` plus bas).
 * 3. Si le pro a `autoAccept = true` ET un wallet suffisant :
 *    - Bascule l'assignment en ACCEPTED dans une transaction
 *      Serializable.
 *    - Debit le wallet via `debitWalletForLead`.
 *    - Ferme le lead via `closeLeadIfFull` s'il vient d'atteindre son
 *      plafond : les pros assignes plus tot dans cette meme boucle
 *      passent EXPIRED ("Vendu" cote dashboard) et le Lead passe
 *      ACCEPTED. Sans ca, seul l'achat manuel fermait un lead.
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

  // Fenetre de reponse du pro = duree de vie du lead, pas un delai court
  // propre a l'assignment. Un artisan est sur chantier la journee : s'il se
  // connecte le soir, l'opportunite doit encore etre la. Le seul evenement
  // qui ferme un assignment avant terme est desormais metier (lead vendu,
  // pris en exclusivite, offert) ou volontaire (refus du pro).
  // Fallback defensif : lead.expiresAt est nullable au schema, mais
  // createLead le pose systematiquement.
  const globalTimeoutHours = await getAppConfig(
    "LEAD_GLOBAL_TIMEOUT_HOURS",
    "int",
  );
  const expiresAt =
    lead.expiresAt ?? new Date(Date.now() + globalTimeoutHours * 3600 * 1000);

  let created = 0;
  let skipped = 0;

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

    const shouldAutoAccept =
      pro.autoAccept && pro.walletBalanceCents >= priceCents;

    // Master-switch notifyByEmail respecte par sendEmailToProfile via
    // deliver() avec requiresOptIn. On passe juste l'email (s'il existe)
    // et la valeur du switch — pas de pre-filtre ici.
    const proEmail = proEmailByProfileId.get(pro.id);

    // Colonnes identiques quelle que soit la forme de l'assignment : seul
    // `status` (et `acceptedAt`) distingue l'auto-accept du PENDING.
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
    // Hoist pour usage post-bloc auto-accept (push "wallet faible").
    let autoAcceptDebit: {
      balanceBeforeCents: number;
      balanceAfterCents: number;
    } | null = null;
    // Pros dont le PENDING vient d'etre ferme parce que CET auto-accept a
    // rempli le lead — push "plus disponible" envoye apres commit.
    let closedProProfileIds: ReadonlyArray<string> = [];

    try {
      if (shouldAutoAccept) {
        // ── Auto-accept : assignment ACCEPTED + debit wallet en une
        // transaction Serializable. Si le wallet est concurremment vide
        // (autre acceptation simultanee), on attrape l'erreur et on
        // retombe en PENDING.
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
              // Un auto-accept ferme le lead exactement comme un achat
              // manuel : les pros deja assignes plus tot dans cette boucle
              // doivent voir leur ligne passer en "Vendu", pas rester
              // achetable. Cf. `closeLeadIfFull`.
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
            // Fallback PENDING : le pro pourra accepter apres recharge.
            const pendingAssignment = await createPendingAssignment();
            assignmentId = pendingAssignment.id;
            finalStatus = "PENDING";
            created++;
          } else {
            throw err;
          }
        }
      } else {
        // ── PENDING simple.
        const pendingAssignment = await createPendingAssignment();
        assignmentId = pendingAssignment.id;
        finalStatus = "PENDING";
        created++;
      }
    } catch (err) {
      // Un pro en echec ne doit pas priver les suivants de leur lead : on
      // passe au suivant. Avant, toute erreur autre qu'un solde
      // insuffisant remontait et interrompait la boucle — les pros non
      // encore parcourus n'etaient ni assignes ni notifies, en silence.
      // Cas realistes : conflit d'unicite [leadId, proProfileId] si deux
      // passes se chevauchent, ou reprises de serialisation epuisees.
      console.error("[matching/assign] pro skipped", {
        leadId,
        proProfileId: pro.id,
        error: err instanceof Error ? err.message : String(err),
      });
      skipped++;
      continue;
    }

    // Non bloquant : `lastLeadReceivedAt` ne sert qu'a la rotation
    // equitable du prochain lead. Le rater ne doit pas empecher la
    // notification d'un assignment deja cree.
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

    // ── Emails ────────────────────────────────────────────────
    // Attendus, pas fire-and-forget : ils ne peuvent pas faire echouer
    // l'assignment (deliver() attrape tout et renvoie un booleen), mais ils
    // serialisent la boucle — N pros matches = N appels Resend a la suite,
    // dans une Server Action user-facing. Acceptable aux volumes V1 ; a
    // basculer en job de fond si le nombre de pros par lead grimpe.
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
      // Masque avant de tronquer : le push part vers TOUS les pros
      // matches, avant tout achat. Masquer apres la troncature laisserait
      // passer un debut de numero.
      const safeDescription = maskContactDetails(lead.description);
      const projectShort =
        safeDescription.length > 60
          ? `${safeDescription.slice(0, 60).trim()}…`
          : safeDescription;
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

    // ── Les pros que cet auto-accept vient d'evincer, et l'alerte de
    //    solde bas : memes notifications que le chemin manuel, donc meme
    //    code (cf. lib/notifications/lead-purchase.ts).
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
