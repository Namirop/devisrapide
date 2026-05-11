// TODO Sprint 2+: replace with real queries
// Stats hardcodées au launch — valeurs honnêtes côté Kamel.

export const LAUNCH_STATS = {
  verifiedPros: { value: 32, label: "artisans vérifiés" },
  monthlyLeads: { value: 127, label: "demandes ce mois" },
  averageRating: { value: 4.7, max: 5, label: "note moyenne" },
  averageDelayHours: { value: 4, label: "délai moyen" },
} as const;
