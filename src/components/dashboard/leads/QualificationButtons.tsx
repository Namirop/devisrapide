"use client";

import { useRouter } from "next/navigation";
import {
  CheckCircle,
  CircleNotch,
  Warning,
  XCircle,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import type { LeadFollowupStatus } from "@prisma/client";
import { toast } from "sonner";

import { useSafeTransition } from "@/hooks/use-safe-transition";
import { cn } from "@/lib/utils";
import { updateFollowupStatus } from "@/server/actions/lead-assignment";

type Props = {
  assignmentId: string;
  current: LeadFollowupStatus;
};

type Choice = {
  status: Exclude<LeadFollowupStatus, "PENDING">;
  label: string;
  icon: Icon;
  activeBg: string;
  activeText: string;
  activeBorder: string;
};

const CHOICES: Choice[] = [
  {
    status: "CONVERTED",
    label: "Lead converti en vente",
    icon: CheckCircle,
    activeBg: "bg-emerald-50",
    activeText: "text-emerald-700",
    activeBorder: "border-emerald-300",
  },
  {
    status: "NO_FOLLOWUP",
    label: "Sans suite",
    icon: XCircle,
    activeBg: "bg-slate-100",
    activeText: "text-slate-700",
    activeBorder: "border-slate-300",
  },
  {
    status: "NOT_REACHABLE",
    label: "Client non joignable",
    icon: Warning,
    activeBg: "bg-orange-50",
    activeText: "text-[#ea580c]",
    activeBorder: "border-orange-300",
  },
];

/**
 * Boutons de qualification du suivi lead (post-acceptation). Appelle la
 * Server Action updateFollowupStatus deja en place Phase 4. Le statut
 * actuel est highlight ; cliquer un autre statut declenche un update +
 * router.refresh pour propager le nouveau highlight.
 */
export function QualificationButtons({ assignmentId, current }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useSafeTransition();

  function handleSelect(status: LeadFollowupStatus) {
    if (status === current) return;
    startTransition(async () => {
      const result = await updateFollowupStatus({ assignmentId, status });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success("Suivi mis à jour.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {CHOICES.map((c) => {
        const Icon = c.icon;
        const active = c.status === current;
        return (
          <button
            key={c.status}
            type="button"
            onClick={() => handleSelect(c.status)}
            disabled={isPending}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-[13.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              active
                ? `${c.activeBg} ${c.activeText} ${c.activeBorder}`
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            {isPending && active ? (
              <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden />
            ) : (
              <Icon size={16} weight="regular" aria-hidden />
            )}
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
