import Image from "next/image";

// "Notre mission" — texte a gauche / illustration a droite (60/40), meme
// esprit que la maquette. Fond du container = meme gris que le fond de
// l'illustration (echantillonne sur le PNG, #f3f4f7) pour que l'image se
// fonde dedans sans bord visible.
export function MissionSection() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-20 lg:pb-24">
      <div
        className="rounded-xl px-7 py-5 sm:px-10 sm:py-6 lg:px-12 lg:py-8"
        style={{ backgroundColor: "#f3f4f7" }}
      >
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">
              Qui sommes-nous
            </p>
            <h2 className="font-display mt-1 text-[26px] font-bold tracking-tight text-slate-900 sm:text-[30px]">
              Notre <span style={{ color: "#ea580c" }}>mission</span>
            </h2>
            <p className="mt-4 max-w-[480px] text-[14.5px] leading-relaxed text-slate-600">
              Nous redéfinissons la mise en relation professionnelle en
              Belgique. Grâce à une technologie moderne et transparente, nous
              permettons aux artisans de sourcer leurs chantiers en un clic,
              sans intermédiaire et sans contrainte.
            </p>
          </div>

          <div className="flex items-center justify-center">
            <Image
              src="/contactpage/illustration-mission.png"
              alt="Un client et un professionnel se serrant la main, satisfaits de leur collaboration"
              width={535}
              height={236}
              className="h-auto w-full max-w-[430px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
