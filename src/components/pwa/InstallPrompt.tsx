"use client";

import { DownloadSimple, ShareNetwork, X } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const DISMISS_KEY = "pwa-install-dismissed";

/**
 * Event type pour beforeinstallprompt. Non-standard (Chromium-only) donc
 * absent des lib.dom.d.ts, on declare une interface ad hoc.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Etendre Navigator pour navigator.standalone (iOS Safari non-standard).
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

type Mode = "hidden" | "android" | "ios";

/**
 * Bannière d'install PWA, affichee uniquement dans le dashboard pro.
 *
 * 2 modes :
 *  - "android" : Chromium emet beforeinstallprompt → bouton qui declenche
 *    le prompt natif. Une fois installe (event appinstalled) ou dismiss,
 *    on cache + memorise localStorage.
 *  - "ios" : pas d'event natif sur iOS Safari, on affiche des instructions
 *    statiques avec l'icone Partage (browser action share/sheet).
 *
 * Si l'app est deja en standalone (deja installee), on ne montre rien.
 * Si dismiss memorise → on ne re-affiche pas.
 */
export function InstallPrompt() {
  const [mode, setMode] = useState<Mode>("hidden");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Bail-out 1 : deja installe en standalone
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as NavigatorWithStandalone).standalone === true;
    if (isStandalone) return;

    // Bail-out 2 : utilisateur a deja dismiss
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      // localStorage indispo (privacy mode) — on continue, dismiss en
      // memoire seulement pour la session.
    }

    // Detecte iOS sans display-mode standalone → mode iOS instructions.
    const isIOS =
      /iPad|iPhone|iPod/.test(window.navigator.userAgent) &&
      !(window.navigator as NavigatorWithStandalone).standalone;

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("android");
    }
    function handleInstalled() {
      setMode("hidden");
      try {
        window.localStorage.setItem(DISMISS_KEY, "1");
      } catch {}
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    // Defere le setMode("ios") pour eviter cascading render synchrone
    // (regle react-hooks/set-state-in-effect du repo).
    const iosTimer = isIOS
      ? window.setTimeout(() => setMode("ios"), 0)
      : null;

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
      if (iosTimer !== null) window.clearTimeout(iosTimer);
    };
  }, []);

  function dismiss() {
    setMode("hidden");
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  async function handleInstallClick() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") {
      setMode("hidden");
      try {
        window.localStorage.setItem(DISMISS_KEY, "1");
      } catch {}
    }
  }

  if (mode === "hidden") return null;

  return (
    <div className="relative flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fermer"
        className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <X size={14} />
      </button>
      <DownloadSimple
        size={28}
        weight="duotone"
        className="mt-0.5 shrink-0 text-[#0f1e3d]"
      />
      <div className="flex flex-1 flex-col gap-2 pr-6">
        <p className="text-sm font-semibold text-slate-900">
          Installez DevisRapide sur votre appareil
        </p>
        {mode === "android" ? (
          <>
            <p className="text-sm text-slate-600">
              Accès rapide depuis votre écran d&apos;accueil, et recevez les
              notifications même quand votre navigateur est fermé.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={handleInstallClick}
              className="w-fit"
            >
              Installer
            </Button>
          </>
        ) : (
          <p className="flex items-start gap-1 text-sm text-slate-600">
            <span>Sur iOS : appuyez sur</span>
            <ShareNetwork size={16} className="mx-1 inline-block shrink-0" />
            <span>
              puis « Sur l&apos;écran d&apos;accueil » pour installer l&apos;app.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
