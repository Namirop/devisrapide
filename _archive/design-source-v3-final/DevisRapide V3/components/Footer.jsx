// Footer — 4 columns + payment row + copyright.

const Footer = () => (
  <footer className="text-white" style={{ backgroundColor: "#0f1f4d" }}>
    <div className="max-w-[1200px] mx-auto px-6 pt-14 pb-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
        {/* Brand col */}
        <div className="col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-[#ea580c] text-white font-bold text-[15px]">
              DR
            </span>
            <span className="font-bold text-[18px] tracking-tight">DevisRapide</span>
          </div>
          <p className="mt-4 text-[13px] text-white/70 leading-relaxed max-w-[260px]">
            La plateforme n°1 en Belgique pour trouver le bon artisan au bon moment.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-[12px] text-white/80">
            <BEFlag className="w-4 h-3 rounded-[1px] inline-block"/>
            Plateforme 100% Belge
          </div>
          <div className="mt-5 flex items-center gap-3">
            {[I.Facebook, I.Instagram, I.Linkedin].map((Ic, i) => (
              <a key={i} href="#" className="w-9 h-9 rounded-md bg-white/10 hover:bg-white/15 grid place-items-center text-white">
                <Ic size={16} strokeWidth={1.75}/>
              </a>
            ))}
          </div>
        </div>

        {/* Services */}
        <div>
          <h4 className="text-[13px] font-semibold uppercase tracking-wider text-white">Nos services</h4>
          <ul className="mt-4 space-y-2.5 text-[13px] text-white/75">
            <li><a href="#" className="hover:text-white">Particuliers <span className="text-white/45">(Devis gratuits)</span></a></li>
            <li><a href="#" className="hover:text-white">B2B &amp; Copropriétés <span className="text-white/45">(Syndics, Bureaux, Commerces)</span></a></li>
            <li><a href="#" className="hover:text-white">SOS Dépannage 24/7 <span className="text-white/45">(Urgences)</span></a></li>
          </ul>
        </div>

        {/* Régions */}
        <div>
          <h4 className="text-[13px] font-semibold uppercase tracking-wider text-white">Régions desservies</h4>
          <ul className="mt-4 space-y-2.5 text-[13px] text-white/75">
            <li><a href="#" className="hover:text-white">Bruxelles <span className="text-white/45">(19 communes)</span></a></li>
            <li><a href="#" className="hover:text-white">Wallonie <span className="text-white/45">(Liège, Namur, Charleroi)</span></a></li>
            <li><a href="#" className="hover:text-white">Brabant Wallon</a></li>
            <li><a href="#" className="hover:text-white">Hainaut</a></li>
            <li><a href="#" className="hover:text-white">Luxembourg</a></li>
            <li className="text-white/45 italic">Bientôt en Flandre</li>
          </ul>
        </div>

        {/* Espace pro */}
        <div>
          <h4 className="text-[13px] font-semibold uppercase tracking-wider text-white">Espace professionnel</h4>
          <ul className="mt-4 space-y-2.5 text-[13px] text-white/75">
            <li><a href="#" className="hover:text-white">Inscription Artisan</a></li>
            <li><a href="#" className="hover:text-white">Comment ça marche&nbsp;?</a></li>
            <li><a href="#" className="hover:text-white">Tarifs &amp; Système de crédits</a></li>
            <li><a href="#" className="hover:text-white">Connexion Pro</a></li>
          </ul>
        </div>

        {/* DevisRapide */}
        <div>
          <h4 className="text-[13px] font-semibold uppercase tracking-wider text-white">DevisRapide</h4>
          <ul className="mt-4 space-y-2.5 text-[13px] text-white/75">
            <li><a href="#" className="hover:text-white">À propos de nous</a></li>
            <li><a href="#" className="hover:text-white">Guide des Primes <span className="text-white/45">(Wallonie &amp; Bruxelles)</span></a></li>
            <li><a href="#" className="hover:text-white">Contactez-nous</a></li>
            <li><a href="#" className="hover:text-white">FAQ <span className="text-white/45">(Questions fréquentes)</span></a></li>
          </ul>
        </div>
      </div>

      {/* Divider */}
      <div className="mt-12 h-px bg-white/10" />

      {/* Bottom row */}
      <div className="mt-6 flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between">
        {/* Payments */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-[11px] uppercase tracking-wider text-white/55">Paiement sécurisé</span>
          <div className="flex items-center gap-2">
            <PayBadge label="Bancontact" bg="#005599"/>
            <PayBadge label="stripe" bg="#635bff"/>
            <PayBadge label="VISA" bg="#1a1f71"/>
            <PayBadge label="mc" bg="#ffffff" mc/>
          </div>
        </div>

        {/* Links */}
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-white/65">
          <li><a href="#" className="hover:text-white">Mentions légales</a></li>
          <li><a href="#" className="hover:text-white">CGU</a></li>
          <li><a href="#" className="hover:text-white">Politique de confidentialité</a></li>
          <li><a href="#" className="hover:text-white">Cookies</a></li>
        </ul>

        <div className="text-[12px] text-white/55">© 2026 DevisRapide — Tous droits réservés · TVA BE 0XXX.XXX.XXX</div>
      </div>
    </div>
  </footer>
);

const PayBadge = ({ label, bg, mc }) => {
  if (mc) {
    return (
      <span className="inline-flex items-center bg-white rounded-sm px-2 h-7" aria-label="Mastercard">
        <span className="w-4 h-4 rounded-full bg-[#eb001b] -mr-1.5"/>
        <span className="w-4 h-4 rounded-full bg-[#f79e1b] mix-blend-multiply"/>
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center px-2 h-7 rounded-sm text-white text-[11px] font-bold tracking-wide"
      style={{ backgroundColor: bg }}
    >
      {label}
    </span>
  );
};

window.Footer = Footer;
