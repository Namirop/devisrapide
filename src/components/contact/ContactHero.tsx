// Bande hero sombre — reprend la structure de la maquette Kamel : titre 2
// lignes + accent orange + 2 paragraphes de reassurance. Fond = couleur unie
// (identique a la teinte de base de l'asset Kamel, echantillonnee sur le
// PNG) + le PNG pose par-dessus a sa taille native (1024px, zero
// agrandissement), colle au bord droit du VIEWPORT (pas d'un container
// borne) — c'est la version que Romain a validee. Plusieurs tentatives
// (fondu CSS, container mx-auto max-w-1400 pour "recentrer" sur tres large
// ecran) n'ont pas convaincu ou ont reintroduit le probleme inverse.
export function ContactHero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: "#011432" }}
    >
      <div
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          backgroundImage: "url('/contactpage/fond-hero-contact.png')",
          backgroundSize: "1024px auto",
          backgroundPosition: "right center",
          backgroundRepeat: "no-repeat",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1400px] px-6 pb-28 pt-14 lg:pb-32 lg:pt-16">
        <h1 className="font-display max-w-[680px] text-[40px] font-extrabold leading-[1.02] tracking-tight text-white sm:text-[52px] lg:text-[62px]">
          Contact &amp;
          <br />
          Informations légales
        </h1>
        <div
          className="mt-4 h-[3px] w-16"
          style={{ backgroundColor: "#ea580c" }}
          aria-hidden
        />
        <p className="mt-6 max-w-[540px] text-[15.5px] leading-relaxed text-white/75">
          Une entreprise belge spécialisée dans la mise en relation entre
          particuliers et professionnels.
        </p>
        <p className="mt-3 max-w-[540px] text-[15.5px] leading-relaxed text-white/75">
          Chez DevisRapide, nous croyons que la confiance est essentielle.
          C&apos;est pourquoi nous mettons toutes nos informations à votre
          disposition en toute transparence.
        </p>
      </div>
    </section>
  );
}
