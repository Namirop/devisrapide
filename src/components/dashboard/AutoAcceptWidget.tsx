"use client";

import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { toggleAutoAccept } from "@/server/actions/pro-profile-actions";

type Props = {
  initialValue: boolean;
};

/**
 * Widget Auto-accept du dashboard home. Toggle visuel maison (pas de
 * Switch shadcn — eviter l'install supplementaire pour 1 usage).
 *
 * Optimistic UI : l'UI suit le state local immediatement, le revalidate
 * du Server Action remet la valeur authoritative depuis la BDD si erreur.
 */
export function AutoAcceptWidget({ initialValue }: Props) {
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
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles
              className="h-4 w-4 text-[#1e3a8a]"
              strokeWidth={2}
              aria-hidden
            />
            <h3 className="text-[14.5px] font-bold text-slate-900">
              Auto-accept
            </h3>
          </div>
          <p className="mt-0.5 text-[12px] text-slate-500">
            {initialValue ? "Activé" : "Désactivé"}
          </p>
        </div>
        <Toggle
          checked={initialValue}
          onChange={handleToggle}
          disabled={isPending}
        />
      </div>
      <p className="mt-3 text-[12.5px] leading-relaxed text-slate-600">
        {initialValue
          ? "Vous achetez automatiquement les leads matchant votre profil et votre zone. Solde wallet débité à chaque acceptation."
          : "Activez l'auto-accept pour recevoir automatiquement les leads matchant vos critères, sans intervention manuelle."}
      </p>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
        checked ? "bg-[#1e3a8a]" : "bg-slate-300",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
