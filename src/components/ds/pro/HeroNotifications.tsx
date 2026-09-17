"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import {
  NOTIFS,
  NotificationContent,
} from "@/components/ds/shared/NotificationPill";
import { cn } from "@/lib/utils";

// CSSProperties n'accepte pas les custom properties (--float-amp) par défaut.
type StyleWithVars = CSSProperties & Record<`--${string}`, string>;

// Notifications flottantes autour du visuel laptop du hero pro, desktop
// uniquement. Animations dans globals.css (transform/opacity) : apparition
// décalée de 400 ms au scroll (.hero-notif-entry), puis flottement continu
// (.hero-notif-float) ; sous reduced-motion, apparition immédiate sans
// flottement.

// Positions relatives au visuel ; la notification du milieu déborde à droite.
const POSITIONS = [
  "right-[4%] top-[-2%]",
  "right-[-6px] top-[30%] 2xl:right-[-40px]",
  "right-[6%] top-[61%]",
] as const;

// Amplitude et phase propres à chaque notification : flottements désynchronisés.
const FLOAT_AMPS_PX = [4, 5, 4] as const;
const FLOAT_DELAYS_MS = [0, 1500, 3000] as const;

export function HeroNotifications() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => setShown(true));
      return;
    }
    // reduced-motion : apparition immédiate (le CSS coupe les keyframes).
    // setState différé en microtâche (règle react-hooks/set-state-in-effect).
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
    // inset-0 : se positionne sur le conteneur du visuel dans ProHero.
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
            {/* Couche qui flotte, séparée de celle qui apparaît : les deux
                animations ne se disputent pas la propriété transform. */}
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
