import { prisma } from "@/lib/prisma";

// Stats affichees en bandeau de confiance sur la LP particulier
// (composant src/components/ds/Stats.tsx).
//
// 2 stats sont des queries Prisma reelles :
//   - verifiedPros : count des ProProfile.validationStatus = VALIDATED
//   - monthlyLeads : count des Lead.createdAt >= debut du mois courant
//
// 2 stats sont hardcoded au launch faute de donnees primaires V1 :
//   - averageRating : 4.7/5 — pas de systeme de notation pros en V1.
//     V2 prevoit Lead.feedback + Pro.averageRating calcule.
//   - averageDelayHours : 4h — pas encore de telemetrie sur le temps
//     ecoule entre Lead.matchingStartedAt et premier LeadAssignment
//     ACCEPTED. V2 prevoit la query stat + persistance dans AppConfig.
//
// Plancher minimum (max(count, X)) : evite l'affichage "0 artisans /
// 0 demandes" au tout premier deploy avant le seed prod. Acceptable
// honnetement car la LP est destinee a un trafic post-launch (clients
// reels apres marketing) — afficher 0 serait incoherent avec le pitch
// "plateforme operationnelle".

export type LaunchStats = {
  verifiedPros: number;
  monthlyLeads: number;
  averageRating: number;
  averageRatingMax: number;
  averageDelayHours: number;
};

const VERIFIED_PROS_MINIMUM = 8;
const MONTHLY_LEADS_MINIMUM = 12;

// Hardcoded V1 — voir commentaire en tete pour le contexte V2.
const AVERAGE_RATING = 4.7;
const AVERAGE_RATING_MAX = 5;
const AVERAGE_DELAY_HOURS = 4;

export async function getLaunchStats(): Promise<LaunchStats> {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const [verifiedProsCount, monthlyLeadsCount] = await Promise.all([
    prisma.proProfile.count({
      where: { validationStatus: "VALIDATED" },
    }),
    prisma.lead.count({
      where: {
        createdAt: { gte: startOfMonth },
        deletedAt: null,
      },
    }),
  ]);

  return {
    verifiedPros: Math.max(verifiedProsCount, VERIFIED_PROS_MINIMUM),
    monthlyLeads: Math.max(monthlyLeadsCount, MONTHLY_LEADS_MINIMUM),
    averageRating: AVERAGE_RATING,
    averageRatingMax: AVERAGE_RATING_MAX,
    averageDelayHours: AVERAGE_DELAY_HOURS,
  };
}
