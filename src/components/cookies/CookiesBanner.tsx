"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "@phosphor-icons/react/dist/ssr";

const STORAGE_KEY = "cookies-acknowledged";

/**
 * Bandeau cookies purement informatif : le site n'utilise que des cookies
 * essentiels (authentification, sécurité, paiement), exemptés de consentement
 * par la directive ePrivacy, d'où l'absence de CMP. La lecture est mémorisée
 * en localStorage ; l'affichage est différé de 800 ms pour ne pas surgir
 * pendant le chargement.
 */
export function CookiesBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const already = window.localStorage.getItem(STORAGE_KEY);
    if (already === "1") return;
    const timeout = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(timeout);
  }, []);

  function acknowledge() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Stockage indisponible (navigation privée stricte) : le bandeau
      // réapparaîtra simplement à la prochaine visite.
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Information cookies"
      className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 sm:px-6 sm:pb-6"
    >
      <div
        className="mx-auto flex max-w-[1100px] flex-col items-start gap-3 rounded-lg p-4 text-white shadow-2xl sm:flex-row sm:items-center sm:gap-5 sm:p-5"
        style={{ backgroundColor: "#0f1e3d" }}
      >
        <p className="text-[13px] leading-relaxed text-white/85 sm:flex-1">
          Ce site utilise uniquement des cookies essentiels au fonctionnement
          (authentification, sécurité, paiement). Aucun cookie de tracking ou de
          publicité.{" "}
          <Link
            href="/cookies"
            className="font-medium text-white underline underline-offset-2 hover:no-underline"
          >
            En savoir plus
          </Link>
        </p>
        <button
          type="button"
          onClick={acknowledge}
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-[#ea580c] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#c2410c] focus:outline-none focus:ring-2 focus:ring-[#ea580c]/40"
        >
          <X size={14} weight="bold" aria-hidden />
          J&apos;ai compris
        </button>
      </div>
    </div>
  );
}
