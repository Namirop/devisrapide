import { Check } from "lucide-react";
import { Reveal } from "./Reveal";
import { Button } from "@/components/ui/button";

// B2B & Coproprietes — section navy avec SVG building a droite + CTA disable.
// Lancement V2.

const BULLETS = [
  "Projets de grande envergure",
  "Interlocuteur dédié",
  "Devis adaptés aux professionnels",
] as const;

function BuildingSvg() {
  return (
    <svg
      viewBox="0 0 600 500"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="b2b-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="b2b-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>
      <rect width="600" height="500" fill="url(#b2b-sky)" />
      {/* Background building */}
      <rect x="40" y="120" width="180" height="360" fill="#64748b" />
      {[...Array(10)].map((_, r) =>
        [...Array(5)].map((_, c) => (
          <rect
            key={`bg-${r}-${c}`}
            x={55 + c * 32}
            y={140 + r * 32}
            width="22"
            height="22"
            fill="#cbd5e1"
            opacity={0.7 + (r % 2) * 0.15}
          />
        )),
      )}
      {/* Foreground tall glass building.
          Les fenetres s'allument en cascade diagonale au hover de la carte
          (regle .b2b-zone:hover .b2b-window dans globals.css). Le
          transition-delay est defini inline pour le stagger. */}
      <rect x="230" y="40" width="240" height="460" fill="url(#b2b-glass)" />
      {[...Array(14)].map((_, r) =>
        [...Array(6)].map((_, c) => {
          const isLit = (r + c) % 3 === 0;
          const delayMs = (r + c) * 35;
          return (
            <rect
              key={`fg-${r}-${c}`}
              x={245 + c * 36}
              y={60 + r * 30}
              width="28"
              height="22"
              className="b2b-window"
              fill={isLit ? "#fef3c7" : "#e2e8f0"}
              opacity="0.85"
              style={{ transitionDelay: `${delayMs}ms` }}
            />
          );
        }),
      )}
      <rect x="230" y="40" width="240" height="6" fill="#0f172a" />
      {/* Small building right */}
      <rect x="480" y="220" width="100" height="280" fill="#475569" />
      {[...Array(8)].map((_, r) =>
        [...Array(3)].map((_, c) => (
          <rect
            key={`sm-${r}-${c}`}
            x={490 + c * 30}
            y={235 + r * 32}
            width="20"
            height="22"
            fill="#94a3b8"
          />
        )),
      )}
      {/* Ground */}
      <rect x="0" y="480" width="600" height="20" fill="#1e293b" />
      <circle cx="40" cy="475" r="28" fill="#334155" />
      <circle cx="80" cy="478" r="22" fill="#334155" />
    </svg>
  );
}

export function B2BSection() {
  return (
    <section id="b2b" className="relative scroll-mt-16">
      <div className="mx-auto max-w-[1350px] px-6 py-12 lg:py-16">
        <Reveal>
          <div
            className="b2b-zone relative grid gap-0 overflow-hidden rounded-lg text-white shadow-md lg:grid-cols-2"
            style={{ backgroundColor: "#1e3a8a" }}
          >
            <div className="p-8 lg:p-12">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                B2B &amp; Copropriétés
              </div>
              <h2 className="mt-3 text-[26px] font-bold leading-[1.15] tracking-tight lg:text-[32px]">
                Gestionnaires d&apos;immeubles
                <br />
                &amp; Entreprises (B2B)
              </h2>
              <p className="mt-4 max-w-[460px] text-[14px] leading-relaxed text-white/80">
                Besoin d&apos;un contrat de maintenance ou d&apos;une rénovation
                globale&nbsp;? Profitez de notre réseau d&apos;experts
                certifiés.
              </p>

              <ul className="mt-6 space-y-3">
                {BULLETS.map((t) => (
                  <li
                    key={t}
                    className="flex items-center gap-3 text-[14px] text-white/95"
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#ea580c]">
                      <Check
                        className="h-3 w-3 text-white"
                        strokeWidth={3}
                        aria-hidden
                      />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  variant="accent"
                  disabled
                  className="h-12 px-6 text-[15px] font-semibold opacity-70"
                >
                  Bientôt disponible
                </Button>
                <span className="text-[12px] text-white/60">
                  Lancement prévu prochainement
                </span>
              </div>
            </div>

            <div className="relative min-h-[280px] bg-slate-800 lg:min-h-[420px]">
              <BuildingSvg />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#1e3a8a]/30" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
