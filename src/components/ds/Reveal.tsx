"use client";

import { useEffect, useRef, useState, type HTMLAttributes } from "react";

// Wrapper d'animation fade-up au scroll. Sprint 5.6 : reecrit en CSS-only
// + IntersectionObserver pour eliminer la dependance framer-motion sur la
// landing (gain ~120 kB parsed / 40 kB gzip cote client).
//
// Visuellement strictement identique a l'ancienne version framer-motion :
//  - Etat initial : opacity 0, translateY 16px
//  - Etat final   : opacity 1, translateY 0
//  - Duree        : 600 ms
//  - Easing       : cubic-bezier(0.22, 1, 0.36, 1)
//  - Trigger      : 80 px de marge negative bas (entre dans le viewport
//                   80px avant le bord)
//  - once: true   : ne rejoue pas si on re-entre dans le viewport
//  - Respect prefers-reduced-motion : pas d'animation, contenu visible
//    immediatement.
//
// AnimatePresence sur les wizards (LeadFormWizard, ProSignupWizard)
// continue d'utiliser framer-motion, scope a leurs routes uniquement.

type RevealProps = HTMLAttributes<HTMLDivElement> & {
  delay?: number;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const DURATION_MS = 600;

export function Reveal({
  delay = 0,
  children,
  style,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    // queueMicrotask defere le 1er setState d'un tick, evite la cascade
    // de re-renders synchrones detectee par react-hooks/set-state-in-effect
    // (regle React Compiler du repo).
    queueMicrotask(() => {
      if (cancelled) return;
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mq.matches) {
        setReduced(true);
        setVisible(true);
        return;
      }
      const el = ref.current;
      if (!el) return;
      if (typeof IntersectionObserver === "undefined") {
        setVisible(true);
        return;
      }
      const obs = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setVisible(true);
              obs.disconnect();
              break;
            }
          }
        },
        // rootMargin negatif bas = element doit etre 80px DANS le viewport
        // (a partir du bord bas) avant de declencher. Equivalent du
        // viewport.margin: "-80px" cote framer-motion.
        { rootMargin: "0px 0px -80px 0px" },
      );
      obs.observe(el);
      cleanup = () => obs.disconnect();
    });
    let cleanup: (() => void) | null = null;
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(16px)",
        transition: reduced
          ? undefined
          : `opacity ${DURATION_MS}ms ${EASE} ${delay}ms, transform ${DURATION_MS}ms ${EASE} ${delay}ms`,
        willChange: visible ? undefined : "opacity, transform",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
