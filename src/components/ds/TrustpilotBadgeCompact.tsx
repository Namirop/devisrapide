import { TrustpilotStar } from "./TrustpilotStar";

// Mini Trustpilot pour le bloc gauche du Hero — variante compacte.
// V1 hardcoded : 4,7/5, 412 avis (coherence avec Testimonials).
// Layout : stars + "X,X/5 sur N avis" a gauche, divider, etoile verte +
// "Trustpilot" a droite. w-full pour matcher la largeur du conteneur parent.

export function TrustpilotBadgeCompact({
  rating = 4.7,
  reviewCount = 412,
}: {
  rating?: number;
  reviewCount?: number;
}) {
  return (
    <div
      className="flex w-full items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5"
      aria-label={`Note ${rating} sur 5 sur Trustpilot — ${reviewCount} avis`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <TrustpilotStar key={i} size={16} />
          ))}
          <TrustpilotStar size={16} half />
        </div>
        <div className="text-[13px] text-slate-700">
          <span className="font-bold text-slate-900">
            {rating.toString().replace(".", ",")}/5
          </span>{" "}
          sur {reviewCount} avis
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="h-5 w-px bg-slate-300" aria-hidden />
        <div className="flex items-center gap-1.5">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            style={{ display: "block" }}
            aria-hidden
          >
            <polygon
              points="12,2 14.85,8.78 22,9.34 16.5,14.17 18.18,21.2 12,17.27 5.82,21.2 7.5,14.17 2,9.34 9.15,8.78"
              fill="#00b67a"
            />
          </svg>
          <span className="text-[13px] font-bold text-slate-900">
            Trustpilot
          </span>
        </div>
      </div>
    </div>
  );
}
