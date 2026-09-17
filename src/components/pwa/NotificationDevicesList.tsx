"use client";

import { CircleNotch, DeviceMobile, Trash } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useSafeTransition } from "@/hooks/use-safe-transition";
import { deletePushSubscription } from "@/server/actions/push-actions";

export type PushDevice = {
  id: string;
  endpoint: string;
  userAgent: string | null;
  createdAt: Date;
  lastUsedAt: Date;
};

/**
 * Appareils abonnés aux notifications push du pro, avec suppression.
 *
 * Rendu directement depuis la prop `devices` (BDD) sans copie en state : une
 * copie ne se resynchroniserait pas lors des router.refresh() déclenchés ici
 * ou par PushSubscriptionManager.
 */
export function NotificationDevicesList({
  devices,
}: {
  devices: PushDevice[];
}) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isPending, startTransition] = useSafeTransition();

  function handleRemove(device: PushDevice) {
    if (isPending) return;
    setRemovingId(device.id);
    startTransition(async () => {
      const res = await deletePushSubscription({ endpoint: device.endpoint });
      if (res.success) {
        toast.success("Appareil retiré.");
        // Recharge les données serveur : l'appareil disparaît de la liste.
        router.refresh();
      } else {
        toast.error(res.message);
      }
      setRemovingId(null);
    });
  }

  if (devices.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Aucun appareil enregistré pour le moment.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {devices.map((d) => (
        <li
          key={d.id}
          className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-3"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <DeviceMobile size={20} className="shrink-0 text-slate-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {formatUserAgent(d.userAgent)}
              </p>
              <p className="text-xs text-slate-500">
                Ajouté le {formatDate(d.createdAt)}
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => handleRemove(d)}
            disabled={isPending}
            aria-label="Retirer cet appareil"
          >
            {removingId === d.id ? (
              <CircleNotch size={16} className="animate-spin" aria-hidden />
            ) : (
              <Trash size={16} />
            )}
          </Button>
        </li>
      ))}
    </ul>
  );
}

function formatUserAgent(ua: string | null): string {
  if (!ua) return "Appareil inconnu";
  // Heuristique simple ; l'ordre compte (un UA Edge contient aussi Chrome/,
  // un UA Chrome contient aussi Safari/).
  if (/iPhone|iPad/.test(ua)) return "iPhone / iPad (Safari)";
  if (/Android/.test(ua) && /Chrome/.test(ua)) return "Android (Chrome)";
  if (/Edg\//.test(ua)) return "Edge desktop";
  if (/Chrome\//.test(ua)) return "Chrome desktop";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua)) return "Safari desktop";
  return "Appareil inconnu";
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("fr-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}
