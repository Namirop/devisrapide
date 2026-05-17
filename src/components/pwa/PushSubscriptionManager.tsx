"use client";

import { BellRinging, BellSlash } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { urlBase64ToUint8Array } from "@/lib/push/vapid-key";
import {
  deletePushSubscription,
  savePushSubscription,
} from "@/server/actions/push-actions";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * Pilote l'opt-in/opt-out des push notifications cote pro.
 *
 * Etats geres :
 *  - unsupported : navigateur sans serviceWorker ou Notification API
 *  - default     : pas encore demande → bouton "Activer"
 *  - granted     : autorise par le navigateur. Verifie si une subscription
 *                  active existe (pushManager.getSubscription) et propose
 *                  "Desactiver"
 *  - denied      : refus navigateur, l'utilisateur doit reactiver dans
 *                  les parametres du site (on ne peut pas re-prompter)
 *
 * Le bouton "Activer" appelle Notification.requestPermission() en
 * reponse a un click utilisateur (best practice : sans interaction,
 * Chrome penalise et bloque les futures demandes).
 */
export function PushSubscriptionManager() {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    // Defere le 1er setState d'un tick pour eviter cascading renders sur
    // le mount synchrone (regle React Compiler du repo).
    queueMicrotask(async () => {
      if (cancelled) return;
      if (!("serviceWorker" in navigator) || !("Notification" in window)) {
        setPermission("unsupported");
        return;
      }
      setPermission(Notification.permission as PermissionState);
      const reg = await navigator.serviceWorker.ready;
      if (cancelled) return;
      const sub = await reg.pushManager.getSubscription();
      if (cancelled) return;
      setIsSubscribed(Boolean(sub));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubscribe() {
    if (!VAPID_PUBLIC_KEY) {
      toast.error("VAPID public key non configurée.");
      return;
    }
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PermissionState);
      if (perm !== "granted") {
        toast.error(
          "Permission refusée. Activez les notifications dans les paramètres du navigateur pour réessayer.",
        );
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const subscription =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          // Cast .buffer en ArrayBuffer : TS strict considere Uint8Array
          // generic comme ArrayBufferLike (peut etre SharedArrayBuffer),
          // mais PushManager n'accepte que ArrayBuffer/ArrayBufferView.
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            .buffer as ArrayBuffer,
        }));

      const json = subscription.toJSON();
      const result = await savePushSubscription({
        endpoint: subscription.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        userAgent: navigator.userAgent.slice(0, 500),
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setIsSubscribed(true);
      toast.success("Notifications activées.");
    } catch (err) {
      console.error("[push] subscribe failed", err);
      toast.error("Impossible d'activer les notifications.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        setIsSubscribed(false);
        return;
      }
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await deletePushSubscription({ endpoint });
      setIsSubscribed(false);
      toast.success("Notifications désactivées sur cet appareil.");
    } catch (err) {
      console.error("[push] unsubscribe failed", err);
      toast.error("Impossible de désactiver les notifications.");
    } finally {
      setLoading(false);
    }
  }

  if (permission === "unsupported") {
    return (
      <p className="text-sm text-slate-500">
        Votre navigateur ne supporte pas les notifications push.
      </p>
    );
  }

  if (permission === "denied") {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        Les notifications sont bloquées par votre navigateur. Pour les
        réactiver, allez dans les paramètres du site (cadenas dans la barre
        d&apos;adresse → Notifications → Autoriser) puis rechargez la page.
      </div>
    );
  }

  if (permission === "granted" && isSubscribed) {
    return (
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
          <BellRinging weight="fill" size={18} />
          Notifications activées sur cet appareil
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUnsubscribe}
          disabled={loading}
          className="w-fit"
        >
          <BellSlash size={16} />
          Désactiver sur cet appareil
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-slate-600">
        Recevez une notification dès qu&apos;un nouveau lead vous est
        attribué, et pour les events critiques (wallet faible, lead bientôt
        expiré).
      </p>
      <Button
        type="button"
        onClick={handleSubscribe}
        disabled={loading}
        className="w-fit"
      >
        <BellRinging size={16} />
        Activer les notifications
      </Button>
    </div>
  );
}
