"use client";

import { DownloadSimple, Export, X } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const DISMISS_KEY = "pwa-install-dismissed";

/** beforeinstallprompt : non standard (Chromium), absent de lib.dom.d.ts. */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// navigator.standalone : propriété non standard d'iOS Safari.
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

type Mode = "hidden" | "android" | "ios";

/**
 * Bannière d'installation PWA du dashboard pro. Mode "android" (Chromium) :
 * bouton qui ouvre le prompt natif. Mode "ios" : Safari n'ayant pas
 * d'équivalent, instructions via le menu Partager. Rien si l'app tourne déjà
 * en standalone ou si la bannière a été fermée (mémorisé en localStorage).
 */
export function InstallPrompt() {
  const [mode, setMode] = useState<Mode>("hidden");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as NavigatorWithStandalone).standalone === true;
    if (isStandalone) return;

    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      // localStorage indisponible (navigation privée) : la fermeture ne
      // vaudra que pour la page en cours.
    }

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

    // setMode("ios") différé (règle react-hooks/set-state-in-effect).
    const iosTimer = isIOS ? window.setTimeout(() => setMode("ios"), 0) : null;

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
    // Le padding externe est porté ici et non par le layout : quand la
    // bannière est masquée, aucun espace vide ne reste sous la TopBar.
    <div className="px-5 pt-4 sm:px-10 sm:pt-5">
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
              <Export size={16} className="mx-1 inline-block shrink-0" />
              <span>
                puis « Sur l&apos;écran d&apos;accueil » pour installer
                l&apos;app.
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
