// Wallonie primes banner — yellow/cream bg, rooster left, copy + CTA, 3 bullets right.

const WalloniaBanner = () => {
  const bullets = [
    { Icon: I.Wallet, t: "Économisez jusqu'à plusieurs milliers d'euros" },
    { Icon: I.Handshake, t: "Accompagnement gratuit dans vos démarches" },
    { Icon: I.FileText, t: "Artisans informés sur les dernières aides" },
  ];

  return (
    <section className="bg-white">
      <div className="max-w-[1200px] mx-auto px-6 pb-10 lg:pb-14">
        <Reveal>
          <div
            className="rounded-lg border overflow-hidden"
            style={{
              backgroundColor: "#fef9c3",
              borderColor: "#fde68a",
            }}
          >
            <div className="grid lg:grid-cols-[auto_1.4fr_1fr] gap-6 lg:gap-8 items-center p-6 lg:p-7">
              {/* Rooster flag */}
              <div className="shrink-0">
                <WalloniaRooster className="w-[88px] h-[88px] rounded-md shadow-sm" />
              </div>

              {/* Copy + CTA */}
              <div>
                <h3 className="text-[19px] lg:text-[20px] font-bold text-slate-900 tracking-tight">
                  Profitez des primes de la Région Wallonne
                </h3>
                <p className="mt-1.5 text-[13px] text-slate-700 leading-relaxed">
                  Isolation, toiture, chauffage… Récupérez jusqu'à plusieurs milliers d'euros
                  sur vos travaux. Nos experts vous aident à remplir les dossiers de primes.
                </p>
                <a
                  href="https://energie.wallonie.be"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button variant="accent" size="md" className="mt-4">
                    Simuler mes aides
                    <I.ArrowUpRight size={16} strokeWidth={2} />
                  </Button>
                </a>
              </div>

              {/* Bullets */}
              <ul className="space-y-3">
                {bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-[13px] text-slate-800">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-white border border-yellow-200 grid place-items-center text-slate-700">
                      <b.Icon size={15} strokeWidth={1.75} />
                    </span>
                    <span className="leading-snug pt-1">{b.t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

window.WalloniaBanner = WalloniaBanner;
