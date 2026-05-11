import { cn } from "@/lib/utils";

const STEPS = [
  { num: 1, label: "Votre besoin" },
  { num: 2, label: "Vos infos" },
  { num: 3, label: "C'est envoyé" },
] as const;

export function HeroStepper({ currentStep = 1 }: { currentStep?: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, idx) => {
        const isActive = step.num === currentStep;
        const isDone = step.num < currentStep;
        return (
          <div key={step.num} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  isActive
                    ? "border-accent bg-accent text-accent-foreground"
                    : isDone
                      ? "border-accent bg-accent/20 text-accent"
                      : "border-border bg-background text-muted-foreground",
                )}
              >
                {step.num}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className="h-px flex-1 bg-border" aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}
