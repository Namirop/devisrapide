"use client";

import { useEffect, useState, type RefObject } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

// Indicateur de scroll pour la zone step content du wizard. Ecoute le scroll
// d'un container interne (pas window) pour fonctionner avec un layout ou
// la page est non-scrollable et seule la zone des cards scroll.
//
// Apparait quand le container a du scroll restant (>24px). Disparait
// instantanement quand on arrive en bas. Chevron statique (pas d'anim).

type Props = {
  containerRef: RefObject<HTMLDivElement | null>;
};

export function ScrollIndicator({ containerRef }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function compute() {
      if (!el) return;
      const scrollable = el.scrollHeight - el.clientHeight;
      const remaining = scrollable - el.scrollTop;
      setVisible(scrollable > 24 && remaining > 24);
    }
    compute();
    el.addEventListener("scroll", compute, { passive: true });
    // Le contenu peut changer (changement d'etape) → ResizeObserver.
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", compute);
      ro.disconnect();
    };
  }, [containerRef]);

  return (
    <div
      className={cn(
        "pointer-events-none absolute -bottom-3 left-1/2 z-10 -translate-x-1/2 transition-opacity duration-200",
        visible ? "opacity-80" : "opacity-0",
      )}
      aria-hidden
    >
      <div className="grid h-7 w-7 place-items-center rounded-full bg-white/90 shadow-sm ring-1 ring-slate-200">
        <ChevronDown
          className="h-[14px] w-[14px] text-slate-500"
          strokeWidth={2.5}
        />
      </div>
    </div>
  );
}
