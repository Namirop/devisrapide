"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Remonte en haut à chaque changement de route, instantanément : avec
// `scroll-behavior: smooth` sur html, le retour en haut de Next serait animé
// (et lent depuis le footer). Les URL avec ancre sont laissées au navigateur.
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
