// Hero V7 — fusion photo + form + fond
// - Photo plus grande, occupe la moitié droite du hero, plein hauteur
// - Gradient slate-50 → transparent sur le bord gauche et bord bas pour fondre
// - Form chevauche la photo (overlap ~50px sur la droite)
// - L'atelier flou continue derrière le form (photo s'étend jusqu'au bord droit)

const CATEGORIES = [
  { id: "toiture", label: "Toiture", Icon: I.Home },
  { id: "plomberie", label: "Plomberie", Icon: I.Wrench },
  { id: "electricite", label: "Électricité", Icon: I.Zap },
  { id: "chauffage", label: "Chauffage", Icon: I.Flame },
  { id: "peinture", label: "Peinture", Icon: I.Paintbrush },
  { id: "menuiserie", label: "Menuiserie", Icon: I.DoorOpen },
  { id: "maconnerie", label: "Maçonnerie", Icon: I.Bricks },
  { id: "carrelage", label: "Carrelage", Icon: I.Grid },
  { id: "sos", label: "SOS Dépannage", Icon: I.Siren, urgent: true },
];

window.CATEGORIES = CATEGORIES;

const FormCard = ({ selected, setSelected, step }) => (
  <div
    className="bg-white p-7 lg:p-8 border border-slate-200/70 w-full max-w-[600px]"
    style={{ boxShadow: "0 20px 40px -12px rgba(15, 23, 42, 0.22), 0 6px 16px -6px rgba(15, 23, 42, 0.10)" }}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[19px] lg:text-[20px] font-bold text-slate-900 leading-snug tracking-tight">
          Décrivez votre besoin<br/>en 2 minutes
        </h2>
        <p className="mt-1 text-[12.5px] text-slate-500">
          Gratuit, rapide et sans engagement
        </p>
      </div>
      <span
        className="shrink-0 inline-flex flex-col items-end px-2.5 py-1.5"
        style={{ backgroundColor: "#eff6ff" }}
      >
        <span className="text-[13px] font-bold leading-none" style={{ color: "#1e3a8a" }}>+127</span>
        <span className="text-[10px] font-medium mt-0.5" style={{ color: "#1e40af" }}>demandes ce mois</span>
      </span>
    </div>

    <div className="mt-4 grid grid-cols-3 gap-2 items-center text-center">
      {[
        { n: 1, label: "Votre besoin" },
        { n: 2, label: "Vos infos" },
        { n: 3, label: "C'est envoyé" },
      ].map((s) => (
        <div key={s.n} className="flex flex-col items-center">
          <div
            className={cn(
              "w-7 h-7 grid place-items-center text-[12px] font-semibold",
              s.n === step
                ? "bg-[#1e3a8a] text-white"
                : "bg-white text-slate-400 border border-slate-200"
            )}
          >
            {s.n}
          </div>
          <div
            className={cn(
              "mt-1.5 text-[10.5px] font-medium",
              s.n === step ? "text-slate-900" : "text-slate-400"
            )}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
    <div className="h-px bg-slate-100 mt-3 mb-4" />

    <div className="text-[13.5px] font-semibold text-slate-900 mb-2.5">
      Quel type de service recherchez-vous&nbsp;?
    </div>

    <div className="grid grid-cols-3 gap-2">
      {CATEGORIES.map((c) => {
        const isSel = selected === c.id;
        return (
          <button
            key={c.id}
            onClick={() => setSelected(c.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 border p-2 h-[68px] transition-colors duration-150",
              isSel
                ? c.urgent
                  ? "border-[#ea580c] bg-orange-50 text-[#ea580c]"
                  : "border-[#1e3a8a] bg-blue-50 text-[#1e3a8a]"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            <c.Icon size={18} strokeWidth={1.75} />
            <span className="text-[11px] font-medium leading-tight text-center">
              {c.label}
            </span>
          </button>
        );
      })}
    </div>

    <Button variant="accent" size="md" className="w-full mt-4 text-[14px] font-semibold h-11" style={{ borderRadius: 0 }}>
      Continuer
      <I.ArrowRight size={16} strokeWidth={2} />
    </Button>

    <div className="mt-3 flex items-center justify-center gap-4 text-[11.5px] text-slate-500">
      {["Sans inscription", "Gratuit", "Réponse rapide"].map((t) => (
        <span key={t} className="inline-flex items-center gap-1">
          <I.Check size={13} strokeWidth={2.5} className="text-[#16a34a]" />
          {t}
        </span>
      ))}
    </div>
  </div>
);

const Hero = () => {
  const [selected, setSelected] = React.useState("sos");
  const [step] = React.useState(1);

  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: "#f8fafc" }}>
      {/* DESKTOP — photo plein bleed sur la moitié droite, full hauteur du hero.
          On utilise background-image + backgroundSize > 100% pour pouvoir vraiment
          décaler l'artisan vers la gauche (avec <img>+cover, object-position-X n'a
          pas d'effet quand l'image remplit pile la largeur — le ratio l'empêche). */}
      <div
        className="hidden lg:block absolute top-0 bottom-0 pointer-events-none"
        style={{ left: "36%", right: 0 }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('assets/hero-artisan.jpg')",
            backgroundSize: "auto 110%",
            backgroundPosition: "-5% center",
            backgroundRepeat: "no-repeat",
          }}
        />
        {/* Fondu bord gauche : slate-50 → transparent */}
        <div
          className="absolute inset-y-0 left-0 w-[140px]"
          style={{
            background: "linear-gradient(to right, #f8fafc 0%, rgba(248,250,252,0.85) 30%, rgba(248,250,252,0) 100%)",
          }}
        />
        {/* Fondu bord bas */}
        <div
          className="absolute inset-x-0 bottom-0 h-[80px]"
          style={{
            background: "linear-gradient(to top, #f8fafc 0%, rgba(248,250,252,0) 100%)",
          }}
        />
        {/* Fondu bord haut très léger */}
        <div
          className="absolute inset-x-0 top-0 h-[40px]"
          style={{
            background: "linear-gradient(to bottom, rgba(248,250,252,0.5) 0%, rgba(248,250,252,0) 100%)",
          }}
        />
      </div>

      {/* MOBILE — photo en background discret */}
      <div className="lg:hidden absolute inset-0 pointer-events-none" aria-hidden="true">
        <img
          src="assets/hero-artisan.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-25"
          style={{ objectPosition: "center 20%" }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(248,250,252,0.85)" }} />
      </div>

      <div className="relative max-w-[1280px] mx-auto px-6 pt-10 lg:pt-14 pb-10 lg:pb-14">
        <div className="grid lg:grid-cols-[1fr_auto] gap-6 lg:gap-0 items-center min-h-[680px]">
          {/* GAUCHE — texte */}
          <div className="flex flex-col max-w-[460px]">
            <div
              className="inline-flex items-center gap-2 self-start rounded-md px-3 py-1.5"
              style={{ backgroundColor: "#fef3e2" }}
            >
              <BEFlag className="w-4 h-3 rounded-[1px] inline-block" />
              <span
                className="text-[10.5px] uppercase tracking-[0.10em] font-semibold"
                style={{ color: "#ea580c" }}
              >
                La plateforme N°1 en Belgique
              </span>
            </div>

            <h1
              className="mt-5 font-bold tracking-tight leading-[1.05] text-[36px] sm:text-[40px] lg:text-[46px]"
              style={{ color: "#1e3a8a" }}
            >
              <span className="block">Le bon artisan,</span>
              <span className="block">sans téléphoner</span>
              <span className="block" style={{ color: "#ea580c" }}>à quinze numéros.</span>
            </h1>

            <p className="mt-4 text-[14.5px] leading-relaxed text-slate-600">
              Décrivez votre besoin en 2 minutes et recevez jusqu'à 3 devis gratuits
              d'artisans vérifiés près de chez vous.
            </p>

            {/* Trust badges — ligne horizontale, icônes simples bleu marine, pas de cercles ni cards.
                + badge "100% Belge" en bout de ligne. */}
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              {[
                { Icon: I.CheckCircle, t: "100% Gratuit", s: "sans engagement" },
                { Icon: I.ShieldCheck, t: "Artisans vérifiés", s: "notés par nos clients" },
                { Icon: I.Lightbulb, t: "Conseils Primes", s: "infos sur les aides" },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="shrink-0" style={{ color: "#1e3a8a" }}>
                    <b.Icon size={18} strokeWidth={1.75} />
                  </span>
                  <div className="leading-tight">
                    <div className="text-[12.5px] font-semibold text-slate-900">{b.t}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{b.s}</div>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <BEFlag className="w-4 h-3 rounded-[1px] inline-block shrink-0" />
                <div className="leading-tight">
                  <div className="text-[12.5px] font-semibold text-slate-900">Plateforme 100% Belge</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">basée à Bruxelles</div>
                </div>
              </div>
            </div>
          </div>

          {/* DROITE — form qui chevauche la photo (overlap ~50px à gauche du form vers la photo) */}
          <div className="relative lg:-ml-12 lg:z-10 flex lg:justify-end w-full lg:w-auto">
            <FormCard selected={selected} setSelected={setSelected} step={step} />
          </div>
        </div>
      </div>
    </section>
  );
};

window.Hero = Hero;
