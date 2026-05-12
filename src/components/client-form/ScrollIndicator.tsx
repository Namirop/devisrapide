"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

// Indicateur de scroll pour les longues etapes du wizard. Apparait quand la
// page a un overflow vertical ET qu'on n'est pas tout en bas. Se met a jour
// au scroll, au resize, et au mount (premier check).
//
// Positionne en fixed bottom-center, juste au-dessus du footer sticky nav.

export function ScrollIndicator() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function compute() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      // Visible si plus de 24px de scroll restant.
      const remaining = scrollable - window.scrollY;
      setVisible(scrollable > 24 && remaining > 24);
    }
    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    // ResizeObserver sur le body : si le contenu du step change de hauteur
    // (changement d'etape) on recompute.
    const ro = new ResizeObserver(compute);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-none fixed bottom-24 left-1/2 z-30 -translate-x-1/2 transition-opacity duration-300",
        visible ? "opacity-70" : "opacity-0",
      )}
      aria-hidden
    >
      <div className="grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow-md backdrop-blur-sm">
        <ChevronDown
          className="h-4 w-4 animate-bounce text-slate-600"
          strokeWidth={2.5}
        />
      </div>
    </div>
  );
}
