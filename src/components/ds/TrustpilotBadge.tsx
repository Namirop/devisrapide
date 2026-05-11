import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Reproduction visuelle Trustpilot (pas d'intégration officielle).
// TODO V2 : remplacer par widget Trustpilot officiel (abonnement requis).

export function TrustpilotBadge({
  rating = 4.7,
  showLabel = true,
  className,
}: {
  rating?: number;
  showLabel?: boolean;
  className?: string;
}) {
  const stars = 5;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm shadow-sm",
        className,
      )}
      aria-label={`Note ${rating} sur 5 sur Trustpilot`}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: stars }).map((_, i) => (
          <Star
            key={i}
            className="h-4 w-4 fill-trustpilot text-trustpilot"
            aria-hidden
          />
        ))}
      </div>
      <span className="font-semibold text-foreground">
        {rating.toFixed(1).replace(".", ",")}/5
      </span>
      {showLabel && (
        <span className="text-muted-foreground">sur Trustpilot</span>
      )}
    </div>
  );
}
