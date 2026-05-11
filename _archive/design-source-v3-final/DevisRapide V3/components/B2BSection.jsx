// B2B & Copropriétés — navy section with building image right, disabled CTA.

const B2BSection = () => (
  <section id="b2b" className="bg-white">
    <div className="max-w-[1200px] mx-auto px-6 pb-12 lg:pb-16">
      <Reveal>
        <div
          className="relative rounded-lg overflow-hidden text-white grid lg:grid-cols-2 gap-0 shadow-md"
          style={{ backgroundColor: "#1e3a8a" }}
        >
          {/* Left text */}
          <div className="p-8 lg:p-12">
            <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-white/70">
              B2B &amp; Copropriétés
            </div>
            <h2 className="mt-3 text-[26px] lg:text-[32px] font-bold tracking-tight leading-[1.15]">
              Gestionnaires d'immeubles<br/>&amp; Entreprises (B2B)
            </h2>
            <p className="mt-4 text-[14px] text-white/80 leading-relaxed max-w-[460px]">
              Besoin d'un contrat de maintenance ou d'une rénovation globale&nbsp;?
              Profitez de notre réseau d'experts certifiés.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                "Projets de grande envergure",
                "Interlocuteur dédié",
                "Devis adaptés aux professionnels",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3 text-[14px] text-white/95">
                  <span className="w-5 h-5 rounded-full bg-[#ea580c] grid place-items-center shrink-0">
                    <I.Check size={12} strokeWidth={3} className="text-white" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-center gap-3 flex-wrap">
              <Button variant="accent" size="lg" disabled className="opacity-70">
                Bientôt disponible
              </Button>
              <span className="text-[12px] text-white/60">
                Lancement prévu prochainement
              </span>
            </div>
          </div>

          {/* Right image */}
          <div className="relative min-h-[280px] lg:min-h-[420px] bg-slate-800">
            <svg
              viewBox="0 0 600 500"
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              {/* Sky */}
              <defs>
                <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#cbd5e1"/>
                  <stop offset="100%" stopColor="#94a3b8"/>
                </linearGradient>
                <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#475569"/>
                  <stop offset="100%" stopColor="#1e293b"/>
                </linearGradient>
              </defs>
              <rect width="600" height="500" fill="url(#sky)"/>
              {/* Background building */}
              <rect x="40" y="120" width="180" height="360" fill="#64748b"/>
              {[...Array(10)].map((_, r) => (
                [...Array(5)].map((_, c) => (
                  <rect key={`${r}-${c}`} x={55 + c * 32} y={140 + r * 32} width="22" height="22" fill="#cbd5e1" opacity={0.7 + (r%2)*0.15}/>
                ))
              ))}
              {/* Foreground tall glass building */}
              <rect x="230" y="40" width="240" height="460" fill="url(#glass)"/>
              {[...Array(14)].map((_, r) => (
                [...Array(6)].map((_, c) => (
                  <rect
                    key={`f-${r}-${c}`}
                    x={245 + c * 36}
                    y={60 + r * 30}
                    width="28"
                    height="22"
                    fill={(r+c)%3===0 ? "#fef3c7" : "#e2e8f0"}
                    opacity="0.85"
                  />
                ))
              ))}
              <rect x="230" y="40" width="240" height="6" fill="#0f172a"/>
              {/* Small building right */}
              <rect x="480" y="220" width="100" height="280" fill="#475569"/>
              {[...Array(8)].map((_, r) => (
                [...Array(3)].map((_, c) => (
                  <rect key={`r-${r}-${c}`} x={490 + c * 30} y={235 + r * 32} width="20" height="22" fill="#94a3b8"/>
                ))
              ))}
              {/* Trees / ground */}
              <rect x="0" y="480" width="600" height="20" fill="#1e293b"/>
              <circle cx="40" cy="475" r="28" fill="#334155"/>
              <circle cx="80" cy="478" r="22" fill="#334155"/>
            </svg>
            {/* Subtle dark overlay for cohesion */}
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#1e3a8a]/30"/>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

window.B2BSection = B2BSection;
