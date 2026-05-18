"use client";

import { useEffect, useRef, useState, type HTMLAttributes } from "react";

// Fade-up au scroll, CSS-only + IntersectionObserver.
//
// Fail-safe : etat initial visible (idle). On bascule en hidden ("armed")
// uniquement si IO est dispo et que reduced-motion est off, puis en
// "shown" au scroll-into-view.
//
// 2 useEffect intentionnels : le 1er arme (setArmed), React commit +
// paint la frame hidden, le 2e (deps [armed]) observe IO sur la frame
// suivante. Sans cette separation, pour les sections deja dans le
// viewport au mount, l'IO callback fire dans la meme tick que setArmed
// → React coalesce les state changes et l'animation est invisible.

type RevealProps = HTMLAttributes<HTMLDivElement> & { delay?: number };

const TRANS = "800ms cubic-bezier(0.22, 1, 0.36, 1)";

export function Reveal({ delay = 0, children, style, ...rest }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Defere le 1er setState d'un tick (regle react-hooks/set-state-in-effect
    // du repo : evite le cascading render synchrone).
    queueMicrotask(() => setArmed(true));
  }, []);

  useEffect(() => {
    if (!armed || !ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          obs.disconnect();
        }
      },
      { rootMargin: "0px 0px -80px 0px" },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [armed]);

  const hidden = armed && !shown;
  return (
    <div
      ref={ref}
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? "translateY(32px)" : "none",
        transition: armed
          ? `opacity ${TRANS} ${delay}ms, transform ${TRANS} ${delay}ms`
          : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
