import { TrustpilotStar } from "./TrustpilotStar";

// Mini Trustpilot pour le bloc gauche du Hero — variante compacte.
// V1 hardcoded : 4,7/5, 412 avis (coherence avec Testimonials).

export function TrustpilotBadgeCompact({
  rating = 4.7,
  reviewCount = 412,
}: {
  rating?: number;
  reviewCount?: number;
}) {
  return (
    <div
      className="inline-flex w-full max-w-[320px] items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3"
      aria-label={`Note ${rating} sur 5 sur Trustpilot — ${reviewCount} avis`}
    >
      <div className="flex items-center gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <TrustpilotStar key={i} size={16} />
        ))}
        <TrustpilotStar size={16} half />
      </div>
      <div className="leading-tight">
        <div className="text-[13px] text-slate-700">
          <span className="font-bold text-slate-900">
            {rating.toString().replace(".", ",")}/5
          </span>{" "}
          sur Trustpilot
        </div>
        <div className="text-[11px] text-slate-500">
          {reviewCount} avis vérifiés
        </div>
      </div>
    </div>
  );
}
