"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { toggleAutoAccept } from "@/server/actions/pro-profile-actions";

type Props = {
  initialValue: boolean;
};

/**
 * Toggle auto-accept inline (sans wrapper card). Utilise dans le
 * RightSidebarPanel du dashboard home, ou dans le widget standalone
 * pour /dashboard/profil. Server Action toggleAutoAccept (commit
 * Sprint 2b) inchangee.
 */
export function AutoAcceptToggleRow({ initialValue }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(next: boolean) {
    startTransition(async () => {
      const result = await toggleAutoAccept({ value: next });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        next
          ? "Auto-accept activé. Les leads matchants seront achetés automatiquement."
          : "Auto-accept désactivé.",
      );
    });
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[13px] font-medium text-slate-900">
          Auto-accept {initialValue ? "activé" : "désactivé"}
        </p>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">
          {initialValue
            ? "Les leads matchants sont achetés automatiquement."
            : "Activez pour acheter les leads matchants sans intervention."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={initialValue}
        disabled={isPending}
        onClick={() => handleToggle(!initialValue)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
          initialValue ? "bg-[#1e3a8a]" : "bg-slate-300",
          isPending && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
            initialValue ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
