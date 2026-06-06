"use client";

import { useEffect, useRef, useState } from "react";

import {
  NOTIFS,
  NotificationPill,
} from "@/components/ds/shared/NotificationPill";
import { cn } from "@/lib/utils";

// Notifs flottantes "gravitant" autour du mockup laptop du hero pro. Desktop
// only (lg+) : le laptop est deja assez charge sur mobile. Reutilise le glass
// pill de la section ProNotifications, pose ici sur un petit "chip" navy pour
// rester lisible sur le hero blanc.
//
// Anims (cf. globals.css, transform/opacity uniquement = GPU) :
//   - apparition sequentielle au scroll-in (IntersectionObserver) : stagger
//     400ms via animation-delay sur la couche positionnee (.hero-notif-entry) ;
//   - micro-flottement infini ±3px sur la couche chip (.hero-notif-float),
//     desync par un animation-delay de phase different par notif.
// prefers-reduced-motion : apparition immediate (snap) + flottement coupe
// (gere en CSS).

// top-right debordant en haut · milieu-droite debordant a droite (plus large
// sur 2xl ou la marge le permet) · bas-droite a l'interieur. A ajuster a l'oeil.
const POSITIONS = [
  "right-[3%] top-[-24px]",
  "right-[-12px] top-[40%] 2xl:right-[-52px]",
  "bottom-[8%] right-[7%]",
] as const;

// Delai de phase du flottement, different par notif → mouvement organique.
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
      {NOTIFS.map((n, i) => (
        <div
          key={i}
          className={cn(
            "hero-notif-entry absolute w-[300px]",
            POSITIONS[i],
            shown && "is-shown",
          )}
          style={{ animationDelay: `${i * 400}ms` }}
        >
          {/* Chip navy = mini-wallpaper : le glass pill (texte blanc) reste
              lisible sur le hero blanc. Couche qui porte le flottement. */}
          <div
            className="hero-notif-float overflow-hidden rounded-[26px] p-2.5 shadow-[0_20px_50px_-20px_rgba(2,6,23,0.55)]"
            style={{
              backgroundImage:
                "linear-gradient(155deg, #1e3a8a 0%, #15285f 55%, #0b1733 100%)",
              animationDelay: `${FLOAT_DELAYS_MS[i]}ms`,
            }}
          >
            <NotificationPill n={n} />
          </div>
        </div>
      ))}
    </div>
  );
}
