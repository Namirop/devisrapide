"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle,
  LockOpen,
  MapPin,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";

import { BEFlag } from "./BEFlag";
import { Button } from "@/components/ui/button";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { cn } from "@/lib/utils";

// Hero de la landing : texte à gauche, formulaire à droite et, sur desktop,
// une photo en bande de largeur fixe entre les deux, fondue dans le blanc
// par des dégradés superposés (voir les commentaires « LEVIERS »).

function FormCard() {
  const router = useRouter();
  const [selected, setSelected] = useState<CategoryId | null>(
    "depannage-urgences",
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const cat = CATEGORIES.find((c) => c.id === selected)!;
    router.push(`/demande?universe=${cat.universeSlug}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-md border border-slate-200/70 bg-white p-5 lg:w-[470px]"
      noValidate
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[23px] font-bold leading-[1.1] tracking-tight text-slate-900">
            Décrivez votre projet
            <br />
            en 2 minutes
          </h2>
          <p className="mt-2 text-[13px] leading-snug text-slate-500">
            Jusqu&apos;à 3 professionnels qualifiés peuvent vous contacter pour
            votre projet.
          </p>
        </div>
        <span
          className="inline-flex shrink-0 flex-row items-center gap-1.5 px-2.5 py-2"
          style={{ backgroundColor: "#eff6ff" }}
        >
          <MapPin
            size={18}
            weight="fill"
            style={{ color: "#1e40af" }}
            aria-hidden
          />
          <span
            className="text-left text-[11px] font-semibold leading-tight"
            style={{ color: "rgb(11, 37, 107)" }}
          >
            Wallonie
            <br />
            &amp; Bruxelles
          </span>
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 items-center gap-2 text-center">
        {[
          { n: 1, label: "Votre projet" },
          { n: 2, label: "Vos infos" },
          { n: 3, label: "Confirmation" },
        ].map((s, i) => {
          const active = s.n === 1;
          const isFirst = i === 0;
          const isLast = i === 2;
          return (
            <div key={s.n} className="relative flex flex-col items-center">
              {!isFirst && (
                <span
                  className="pointer-events-none absolute left-[-4px] right-1/2 top-[13px] z-0 h-px bg-slate-200"
                  aria-hidden
                />
              )}
              {!isLast && (
                <span
                  className="pointer-events-none absolute left-1/2 right-[-4px] top-[13px] z-0 h-px bg-slate-200"
                  aria-hidden
                />
              )}
              <div
                className={cn(
                  "relative z-10 grid h-7 w-7 place-items-center text-[13px] rounded-md font-semibold",
                  active
                    ? "bg-[#1e3a8a] text-white"
                    : "border border-slate-200 bg-white text-slate-400",
                )}
              >
                {s.n}
              </div>
              <div
                className={cn(
                  "mt-1.5 text-[11px] font-medium",
                  active ? "text-slate-900" : "text-slate-400",
                )}
              >
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
      <div className="my-3 h-px bg-slate-100" />

      <div className="mb-2 text-[15px] font-semibold text-slate-900">
        Quel type de service recherchez-vous ?
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {CATEGORIES.map((c) => {
          const isSel = selected === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c.id)}
              className={cn(
                "flex h-[114px] flex-col items-center justify-center gap-3 border px-1.5 py-2.5 transition-colors duration-150",
                isSel
                  ? c.urgent
                    ? "border-[#ea580c] bg-orange-50 text-[#ea580c]"
                    : "border-[#1e3a8a] bg-blue-50 text-[#1e3a8a]"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
              )}
              aria-pressed={isSel}
            >
              <span className="flex h-10 items-center justify-center">
                <Image
                  src={c.iconSrc}
                  alt=""
                  width={100}
                  height={40}
                  unoptimized
                  className="h-10 object-contain"
                  style={{ width: "auto" }}
                />
              </span>
              <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight">
                {c.label}
              </span>
            </button>
          );
        })}
      </div>

      <Button
        type="submit"
        variant="accent"
        className="mt-4 h-12 w-full text-[14px] font-semibold"
      >
        Continuer
        <ArrowRight size={16} weight="bold" aria-hidden />
      </Button>

      <div className="mt-3 flex items-center justify-center gap-4 text-[12.5px] text-slate-500">
        {["Sans inscription", "Gratuit", "Réponse rapide"].map((t) => (
          <span key={t} className="inline-flex items-center gap-1">
            <Check
              size={13}
              weight="bold"
              className="text-[#16a34a]"
              aria-hidden
            />
            {t}
          </span>
        ))}
      </div>
    </form>
  );
}

// Espace insécable avant le % : typographie française, et pas de retour à la
// ligne entre « 100 » et « % » sur mobile. Libellés sans sous-titre : la
// rangée doit tenir à gauche de la photo (~470 px) sans chevaucher l'artisan.
const TRUST_BADGES = [
  { Icon: CheckCircle, t: "100 % gratuit" },
  { Icon: ShieldCheck, t: "Professionnels vérifiés" },
  { Icon: LockOpen, t: "Sans engagement" },
] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Grille décorative réservée au Hero. */}
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern"
        aria-hidden
      />

      {/* Fondu bas vers slate-50 (section suivante) : 64 px de haut mais
          transparent jusqu'à 60 %, pour une transition courte sans ligne de
          démarcation. z-[5] : au-dessus de la grille et de la photo, sous le
          contenu (z-10). */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-16 bg-[linear-gradient(to_bottom,transparent_60%,#f8fafc_100%)]"
        aria-hidden
      />

      {/* DESKTOP — photo en bande. Les fondus sont des overlays blancs
          dégradés (pas de mask) : leurs bords opaques se confondent avec le
          fond blanc de la section. Le wrapper reprend le conteneur du contenu
          (max-w-[1400px] centré) pour que la bande reste alignée sur le
          formulaire quel que soit le viewport.
          LEVIERS : position `right` et `width` de la bande, paliers et alpha
          des dégradés. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-full max-w-[1400px] -translate-x-1/2 lg:block"
        aria-hidden
      >
        <div
          className="absolute bottom-0 top-0"
          style={{ right: "3%", left: "auto", width: "900px" }}
        >
          {/* Couche 1 : photo. Image et bande en largeur fixe (px) : l'artisan
              reste collé au formulaire quels que soient zoom et viewport, ce
              qu'une taille dérivée de la hauteur ne garantit pas. Calée en
              haut : tout écart vertical tombe sur les pieds, masqués par le
              fondu bas.
              LEVIERS : `width` de la bande et `backgroundSize`, à ajuster
              ensemble pour garder le contact avec le formulaire. */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/images/hero-artisan-800.webp')",
              backgroundSize: "1200px auto",
              backgroundRepeat: "no-repeat",
            }}
          />
          {/* Couche 2 : fondu horizontal asymétrique. 14 % à gauche vers la
              zone texte ; 6 % seulement à droite, où la FormCard recouvre
              déjà la photo. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, #ffffff 0%, rgba(255,255,255,0.65) 2%, rgba(255,255,255,0.30) 5%, rgba(255,255,255,0.10) 9%, rgba(255,255,255,0.02) 12%, rgba(255,255,255,0) 14%, rgba(255,255,255,0) 94%, rgba(255,255,255,0.20) 97%, rgba(255,255,255,0.65) 99%, #ffffff 100%)",
            }}
          />
          {/* Couche 3 : fondu vertical, en bas uniquement (pieds de
              l'artisan). */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 80%, rgba(255,255,255,0.16) 87%, rgba(255,255,255,0.48) 93%, rgba(255,255,255,0.85) 97%, #ffffff 100%)",
            }}
          />
        </div>
      </div>

      {/* Pas de photo sur mobile : seule la grille reste visible. */}

      {/* Même max-w que le wrapper photo : texte, formulaire et photo restent
          alignés. */}
      <div className="relative mx-auto max-w-[1400px] px-6 pb-10 pt-10 lg:pb-5 lg:pt-6">
        <div className="grid min-h-[440px] items-start gap-6 lg:grid-cols-[1fr_auto] lg:gap-0">
          {/* GAUCHE — texte. LEVIER : max-w du bloc. */}
          <div className="relative z-10 flex max-w-[640px] flex-col lg:translate-y-8">
            <div className="inline-flex items-center gap-2 self-start">
              <BEFlag className="inline-block h-3 w-4 rounded-[1px]" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-700 sm:text-[11px] sm:tracking-[0.12em]">
                Plateforme belge de mise en relation pour vos travaux
              </span>
            </div>

            {/* Titre en Plus Jakarta Sans (variable --font-display), comme
                ProHero ; la classe .font-display, elle, utilise Bricolage
                Grotesque (cf. globals.css). */}
            <h1
              className="mt-2 text-[40px] font-extrabold leading-[1.00] sm:text-[44px] md:text-[54px] lg:text-[69px]"
              style={{
                color: "#1e3a8a",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.035em",
              }}
            >
              <span className="block">Le bon artisan,</span>
              <span className="block">sans téléphoner</span>
              <span
                className="block sm:whitespace-nowrap"
                style={{ color: "#ea580c" }}
              >
                à quinze numéros.
              </span>
            </h1>

            {/* Deux paragraphes : le premier porte la promesse (les 2 minutes
                qualifient le formulaire), le second présente le pro comme
                l'auteur du devis.
                max-w 470 px : au-delà, les lignes déborderaient sur la partie
                visible de la photo. Le titre ne touche que le bord fondu. */}
            <p className="mt-4 max-w-[470px] text-[15.5px] leading-relaxed text-slate-600">
              Décrivez votre projet en 2 minutes et trouvez des professionnels
              qualifiés près de chez vous.
            </p>
            <p className="mt-2.5 max-w-[470px] text-[14.5px] leading-relaxed text-slate-500">
              Ils vous contactent directement pour échanger sur votre projet et
              établir leur devis après avoir évalué les travaux avec vous.
            </p>

            <div className="mt-8 w-full sm:w-fit">
              {/* Mobile : 3 colonnes centrées, icône au-dessus. sm+ : rangée
                  inline, icône à gauche. */}
              <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-row sm:flex-nowrap sm:items-center sm:gap-x-4">
                {TRUST_BADGES.map((b) => (
                  <div
                    key={b.t}
                    className="flex flex-col items-center gap-1 text-center sm:flex-row sm:items-center sm:gap-2 sm:text-left"
                  >
                    <span className="shrink-0" style={{ color: "#1e3a8a" }}>
                      <b.Icon size={20} weight="regular" aria-hidden />
                    </span>
                    <div className="text-[12px] font-semibold leading-tight text-slate-900 sm:text-[13px]">
                      {b.t}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DROITE — formulaire. -translate-y le remonte légèrement sans
              changer la hauteur de la section (transform). */}
          <div className="relative z-10 flex w-full lg:w-auto lg:-translate-y-4 lg:justify-end">
            <FormCard />
          </div>
        </div>
      </div>
    </section>
  );
}
