"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Siren } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMetierIcon, type MetierSlug } from "./MetierIcon";

const TRAVAUX: ReadonlyArray<{ slug: Exclude<MetierSlug, "sos-depannage">; label: string }> = [
  { slug: "toiture", label: "Toiture" },
  { slug: "plomberie", label: "Plomberie" },
  { slug: "electricite", label: "Électricité" },
  { slug: "chauffage", label: "Chauffage" },
  { slug: "peinture", label: "Peinture" },
  { slug: "menuiserie", label: "Menuiserie" },
  { slug: "maconnerie", label: "Maçonnerie" },
  { slug: "carrelage", label: "Carrelage" },
];

export function NavMetiersDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 hover:text-foreground"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Métiers
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            role="menu"
            className="absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 rounded-lg border border-border bg-card p-2 shadow-xl"
          >
            <div className="grid grid-cols-2 gap-1">
              {TRAVAUX.map((m) => {
                const Icon = getMetierIcon(m.slug);
                return (
                  <Link
                    key={m.slug}
                    href={`/demande?universe=travaux&category=${m.slug}`}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    <Icon className="h-4 w-4 text-primary" aria-hidden />
                    {m.label}
                  </Link>
                );
              })}
            </div>
            <div className="mt-2 border-t border-border pt-2">
              <Link
                href="/demande?universe=sos-depannage"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-md bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <span className="inline-flex items-center gap-2">
                  <Siren className="h-4 w-4" aria-hidden />
                  SOS Dépannage
                </span>
                <span className="rounded-sm bg-destructive/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                  24/7
                </span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
