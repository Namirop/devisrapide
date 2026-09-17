// Bande hero sombre. Le fond uni reprend la teinte de base de l'image, posée
// à sa taille native (1024px, sans agrandissement) contre le bord droit du
// viewport : l'image se fond dans le fond quelle que soit la largeur d'écran.
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
