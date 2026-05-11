"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

// Wrapper d'animation fade-up au scroll, API `delay` en ms (comme le proto).
// Sous le capot : framer-motion + whileInView, courbe cubic-bezier
// (0.22, 1, 0.36, 1), respecte prefers-reduced-motion automatiquement.

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  children: React.ReactNode;
};

export function Reveal({ delay = 0, children, ...rest }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.6,
        delay: delay / 1000,
        ease: [0.22, 1, 0.36, 1],
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
