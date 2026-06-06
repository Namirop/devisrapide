"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import {
  NOTIFS,
  NotificationContent,
} from "@/components/ds/shared/NotificationPill";
import { cn } from "@/lib/utils";

// CSSProperties + custom properties (--float-amp), non typees par defaut.
type StyleWithVars = CSSProperties & Record<`--${string}`, string>;

// Notifs flottantes "gravitant" autour du mockup laptop du hero pro. Desktop
// only (lg+) : le laptop est deja assez charge sur mobile. Chaque notif est un
// SEUL element navy autonome (pas de container autour) reutilisant le contenu
// partage (NotificationContent), en version compacte.
//
// Anims (cf. globals.css, transform/opacity uniquement = GPU) :
//   - apparition sequentielle au scroll-in (IntersectionObserver) : stagger
//     400ms via animation-delay sur la couche positionnee (.hero-notif-entry) ;
//   - micro-flottement infini sur la couche notif (.hero-notif-float),
//     amplitude (--float-amp) + delai de phase differents par notif → organique.
// prefers-reduced-motion : apparition immediate (snap) + flottement coupe
// (gere en CSS).

// top-right debordant en haut · milieu-droite debordant a droite (plus large
// sur 2xl ou la marge le permet) · bas-droite a l'interieur. A ajuster a l'oeil.
const POSITIONS = [
  "right-[3%] top-[-18px]",
  "right-[-8px] top-[40%] 2xl:right-[-44px]",
  "bottom-[8%] right-[7%]",
] as const;

// Flottement desync : amplitude + delai de phase differents par notif.
const FLOAT_AMPS_PX = [6, 8, 7] as const;
const FLOAT_DELAYS_MS = [0, 1500, 3000] as const;

export function HeroNotifications() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => setShown(true));
      return;
    }
    // reduced-motion : apparition immediate, le CSS coupe les keyframes. Differe
    // d'un tick (regle react-hooks/set-state-in-effect du repo).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      queueMicrotask(() => setShown(true));
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          obs.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    // inset-0 → contexte de positionnement = boite du laptop (parent lg:absolute
    // dans ProHero). pointer-events-none : purement decoratif.
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden lg:block"
    >
      {NOTIFS.map((n, i) => {
        const floatStyle: StyleWithVars = {
          backgroundImage:
            "linear-gradient(155deg, #1e3a8a 0%, #15285f 55%, #0b1733 100%)",
          animationDelay: `${FLOAT_DELAYS_MS[i]}ms`,
          "--float-amp": `${FLOAT_AMPS_PX[i]}px`,
        };
        return (
          <div
            key={i}
            className={cn(
              "hero-notif-entry absolute w-[240px]",
              POSITIONS[i],
              shown && "is-shown",
            )}
            style={{ animationDelay: `${i * 400}ms` }}
          >
            {/* Notif navy autonome (= le seul fond, pas de container) sur
                laquelle court le flottement. Le ring clair donne le leger
                effet "glass". */}
            <div
              className="hero-notif-float flex items-center gap-2.5 rounded-[18px] px-2.5 py-2 shadow-[0_16px_38px_-16px_rgba(2,6,23,0.5)] ring-1 ring-white/10"
              style={floatStyle}
            >
              <NotificationContent n={n} compact />
            </div>
          </div>
        );
      })}
    </div>
  );
}
