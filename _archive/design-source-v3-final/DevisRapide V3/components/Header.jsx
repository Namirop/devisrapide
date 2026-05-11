// Top bar (thin blue) + main header.

const Header = () => {
  return (
    <header className="sticky top-0 z-40 bg-white">
      {/* Main bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 h-[68px] flex items-center justify-between gap-4">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 shrink-0" aria-label="DevisRapide">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-[#ea580c] text-white font-bold text-[15px] tracking-tight">
              DR
            </span>
            <span className="font-bold text-[18px] text-[#1e3a8a] tracking-tight">
              DevisRapide
            </span>
          </a>

          {/* Nav */}
          <nav className="hidden lg:flex items-center gap-7 text-[14px] font-medium text-slate-700">
            <a href="#how" className="hover:text-[#1e3a8a]">Comment ça marche</a>
            <button className="inline-flex items-center gap-1 hover:text-[#1e3a8a]">
              Métiers <I.ChevronDown size={14} strokeWidth={2} />
            </button>
            <a href="#pros" className="hover:text-[#1e3a8a]">Pour les pros</a>
            <a href="#avis" className="hover:text-[#1e3a8a]">Avis clients</a>
          </nav>

          {/* Phone + CTAs */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 pr-2 border-r border-slate-200">
              <I.Phone size={18} className="text-[#1e3a8a]" strokeWidth={2} />
              <div className="leading-tight">
                <div className="text-[13px] font-semibold text-slate-900">02 XXX XX XX</div>
                <div className="text-[11px] text-slate-500">Lun-Ven · 8h-18h</div>
              </div>
            </div>
            <Button variant="outline" size="md" className="hidden sm:inline-flex">Espace pro</Button>
            <Button variant="accent" size="md">Demander un devis</Button>
          </div>
        </div>
      </div>
    </header>
  );
};

window.Header = Header;
