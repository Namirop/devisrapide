"use client";

import { useEffect, useRef, useState, type HTMLAttributes } from "react";

// Apparition en fondu au scroll (IntersectionObserver + transition CSS).
//
// Le contenu est visible par défaut et n'est masqué (« armed ») que si
// IntersectionObserver existe et que reduced-motion est désactivé.
//
// Deux effets distincts : le premier masque, le second observe après le rendu
// masqué. Dans un seul effet, une section déjà visible au montage déclencherait
// le callback dans le même tick ; React fusionnerait les deux mises à jour et
// l'animation ne se verrait pas.

type RevealProps = HTMLAttributes<HTMLDivElement> & { delay?: number };

const TRANS = "800ms cubic-bezier(0.22, 1, 0.36, 1)";

export function Reveal({ delay = 0, children, style, ...rest }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // setState différé en microtâche (règle react-hooks/set-state-in-effect).
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
