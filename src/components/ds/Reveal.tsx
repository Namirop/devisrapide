"use client";

import { useEffect, useRef, useState, type HTMLAttributes } from "react";

// Wrapper d'animation fade-up au scroll. Sprint 5.6 : CSS-only +
// IntersectionObserver, sans dependance framer-motion.
//
// PRIORITE FAIL-SAFE (Sprint 5.6 hotfix) : le contenu doit etre VISIBLE
// par defaut, en toute circonstance. L'animation est un opt-in que le
// JS client arme conditionnellement. Si :
//   - JS desactive
//   - IntersectionObserver non supporte
//   - prefers-reduced-motion: reduce
//   - L'observer ne fire jamais (bug navigateur, timeout filet)
//   - Element deja visible dans le viewport au mount (above the fold)
// → le contenu reste affiche, jamais cache.
//
// Animation visuellement identique a l'ancienne version framer-motion
// pour les elements below-the-fold :
//   - Etat hidden : opacity 0, translateY 16px
//   - Etat shown  : opacity 1, translateY 0
//   - Duree       : 600 ms
//   - Easing      : cubic-bezier(0.22, 1, 0.36, 1)
//   - Trigger     : rootMargin "0px 0px -80px 0px"
//                   (= viewport.margin "-80px" framer-motion)
//
// AnimatePresence sur les wizards continue d'utiliser framer-motion,
// scope a /demande et /inscription-pro.

type RevealProps = HTMLAttributes<HTMLDivElement> & {
  delay?: number;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const DURATION_MS = 600;
// Filet de securite : si l'IntersectionObserver ne fire pas dans ce
// delai (bug navigateur, element jamais en intersection, etc.), on
// force shown pour ne pas laisser un contenu cache permanent.
const SAFETY_TIMEOUT_MS = 5000;

type Phase = "idle" | "armed" | "shown";

export function Reveal({
  delay = 0,
  children,
  style,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Phase "idle" = visible (etat de demarrage + fail-safe). Le JS bascule
  // vers "armed" (= hidden) UNIQUEMENT quand toutes les conditions de
  // securite sont reunies et que l'element est below-the-fold. Puis IO
  // bascule vers "shown" pour l'animation.
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof IntersectionObserver === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return; // reste idle = visible, aucune animation
    const el = ref.current;
    if (!el) return;

    // Check above-the-fold : si l'element est deja dans le viewport au
    // mount, on skip l'animation (et donc le flash visible→hidden→shown
    // qui se produirait si on armait). Utilise le meme seuil 80px que
    // l'IO rootMargin.
    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    if (rect.top < viewportHeight - 80) return; // visible, pas d'anim

    setPhase("armed");

    let timeoutId: number | null = null;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setPhase("shown");
            obs.disconnect();
            if (timeoutId !== null) window.clearTimeout(timeoutId);
            break;
          }
        }
      },
      // rootMargin negatif bas : element doit etre 80px DANS le viewport
      // (a partir du bord bas) avant de declencher. Equivalent du
      // viewport.margin: "-80px" cote framer-motion.
      { rootMargin: "0px 0px -80px 0px" },
    );
    obs.observe(el);

    // Filet de securite : si l'IO ne fire pas dans 5s (bug, mauvais
    // scroll container, etc.), on force visible plutot que laisser le
    // contenu cache permanent.
    timeoutId = window.setTimeout(() => {
      setPhase("shown");
      obs.disconnect();
    }, SAFETY_TIMEOUT_MS);

    return () => {
      obs.disconnect();
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, []);

  // hidden = uniquement quand le JS a explicitement arme l'element.
  // Toute autre phase (idle = defaut SSR + fail-safe, shown = anim terminee)
  // affiche le contenu.
  const hidden = phase === "armed";
  // transition active uniquement quand on a arme (armed) ou affiche apres
  // armement (shown). En "idle" : pas de transition, pas d'opacity change
  // visible.
  const transitionActive = phase !== "idle";

  return (
    <div
      ref={ref}
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? "translateY(16px)" : "none",
        transition: transitionActive
          ? `opacity ${DURATION_MS}ms ${EASE} ${delay}ms, transform ${DURATION_MS}ms ${EASE} ${delay}ms`
          : undefined,
        willChange: hidden ? "opacity, transform" : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
