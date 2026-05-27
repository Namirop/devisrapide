"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  updateNotifyByEmail,
  updateNotifyByPush,
} from "@/server/actions/pro-profile-actions";

type Props = {
  initialNotifyByPush: boolean;
  initialNotifyByEmail: boolean;
};

/**
 * Two toggle rows pour les master-switches notifications du pro :
 *  - Push : mute serveur (sendPushToProfile skip si false). Independant
 *    de l'opt-in browser (PushSubscriptionManager) — un pro peut etre
 *    abonne au browser mais avoir notifyByPush=false pour mettre en
 *    pause sans desinscrire ses appareils.
 *  - Email : opt-out des emails marketing (new-lead, lead-accepted,
 *    low-balance). Les emails essentials (recharge, lifecycle admin,
 *    lead offert) restent envoyes — c'est explique dans le warning
 *    en bas du bloc.
 */
export function NotificationsToggles({
  initialNotifyByPush,
  initialNotifyByEmail,
}: Props) {
  const [byPush, setByPush] = useState(initialNotifyByPush);
  const [byEmail, setByEmail] = useState(initialNotifyByEmail);
  const [isPending, startTransition] = useTransition();

  function handleTogglePush(next: boolean) {
    setByPush(next); // optimistic
    startTransition(async () => {
      const result = await updateNotifyByPush({ value: next });
      if (!result.ok) {
        setByPush(!next); // revert
        toast.error(result.error);
        return;
      }
      toast.success(
        next
          ? "Notifications push activées."
          : "Notifications push mises en pause.",
      );
    });
  }

  function handleToggleEmail(next: boolean) {
    setByEmail(next);
    startTransition(async () => {
      const result = await updateNotifyByEmail({ value: next });
      if (!result.ok) {
        setByEmail(!next);
        toast.error(result.error);
        return;
      }
      toast.success(
        next ? "Alertes email activées." : "Alertes email mises en pause.",
      );
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <ToggleRow
        title={`Notifications push ${byPush ? "activées" : "désactivées"}`}
        description={
          byPush
            ? "Vous recevez les notifications push sur vos appareils enregistrés."
            : "Pause serveur : aucune notification push envoyée. Vos appareils restent enregistrés."
        }
        value={byPush}
        disabled={isPending}
        onChange={handleTogglePush}
      />

      <ToggleRow
        title={`Alertes email ${byEmail ? "activées" : "désactivées"}`}
        description={
          byEmail
            ? "Vous recevez les emails de nouveaux leads, acceptations et alertes wallet."
            : "Pause des emails marketing (nouveaux leads, acceptations, solde faible)."
        }
        value={byEmail}
        disabled={isPending}
        onChange={handleToggleEmail}
      />

      <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] leading-relaxed text-slate-600">
        <strong className="text-slate-700">Note&nbsp;:</strong> désactiver les
        emails ne supprime pas les emails essentiels — confirmation de
        recharge wallet, changements de statut de compte, leads offerts par
        l&apos;équipe — qui restent envoyés.
      </p>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  value,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  value: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[13px] font-medium text-slate-900">{title}</p>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
          value ? "bg-[#1e3a8a]" : "bg-slate-300",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
            value ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
