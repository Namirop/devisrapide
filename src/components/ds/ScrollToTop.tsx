"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Reset scroll au changement de route. `scroll-behavior: smooth` sur html
// rend le scroll-to-top auto de Next animé (et lent depuis un footer long),
// donc on force un scroll instantané. On n'intervient pas si l'URL cible
// contient un hash : on laisse le navigateur scroller vers l'ancre.
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
