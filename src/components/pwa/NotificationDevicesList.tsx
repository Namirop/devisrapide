"use client";

import { CircleNotch, DeviceMobile, Trash } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deletePushSubscription } from "@/server/actions/push-actions";

export type PushDevice = {
  id: string;
  endpoint: string;
  userAgent: string | null;
  createdAt: Date;
  lastUsedAt: Date;
};

/**
 * Liste les devices enregistres pour les push notifications du pro,
 * avec possibilite de retirer un device specifique.
 *
 * Rendu directement depuis la prop `devices` (BDD, source de verite) — pas
 * de copie en state local : sinon la liste ne se resynchroniserait pas sur
 * un router.refresh() (declenche apres activer/desactiver dans
 * PushSubscriptionManager, ou apres suppression ici).
 *
 * Le user-agent est tronque a une forme lisible (premier token + OS si
 * detecte). En cas d'echec parsing, on retombe sur "Appareil inconnu".
 */
export function NotificationDevicesList({
  devices,
}: {
  devices: PushDevice[];
}) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRemove(device: PushDevice) {
    if (isPending) return;
    setRemovingId(device.id);
    startTransition(async () => {
      const res = await deletePushSubscription({ endpoint: device.endpoint });
      if (res.success) {
        toast.success("Appareil retiré.");
        // router.refresh() re-render le composant serveur → la liste reflete
        // la BDD (l'appareil disparait). Reset event-driven du marqueur de
        // ligne occupee, pas dans un effect (regle React Compiler du repo).
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
  // Heuristique minimale, suffisante pour distinguer les devices en V1.
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
