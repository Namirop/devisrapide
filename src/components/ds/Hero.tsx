"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle,
  Lightbulb,
  MapPin,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";

import { BEFlag } from "./BEFlag";
import { Button } from "@/components/ui/button";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { cn } from "@/lib/utils";

// Hero — 3 zones cote a cote : texte gauche / photo bornee / form droite.
// Photo dans une zone bornee absolue (left/right en %) sur desktop.
// Fades sur les 4 cotes via mask-image (1 propriete CSS, 2 gradients
// combines avec mask-composite intersect).
//
// Leviers d'ajustement principaux (cherche les commentaires "LEVIER:") :
//   - Position bande photo (left/right %)
//   - Zoom artisan (backgroundSize)
//   - Cadrage artisan dans la bande (backgroundPosition)
//   - Tailles des fades (px dans mask-image)
//   - Largeur form (max-w-[Xpx] dans FormCard)
//   - Largeur texte bloc (max-w-[Xpx] sur le wrapper texte)

function FormCard() {
  const router = useRouter();
  const [selected, setSelected] = useState<CategoryId | null>(
    "depannage-urgences",
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const cat = CATEGORIES.find((c) => c.id === selected)!;
    const params = new URLSearchParams({ universe: cat.universeSlug });
    if (cat.categorySlug) params.set("category", cat.categorySlug);
    router.push(`/demande?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-md border border-slate-200/70 bg-white p-5 lg:w-[430px]"
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
            Recevez jusqu&apos;à 3 devis gratuits de professionnels qualifiés,
            que vous soyez un particulier ou une entreprise.
          </p>
        </div>
        <span
          className="inline-flex shrink-0 flex-col items-center gap-1 rounded-md px-2.5 py-2 text-center"
          style={{ backgroundColor: "#eff6ff" }}
        >
          <MapPin
            size={18}
            weight="fill"
            style={{ color: "#1e40af" }}
            aria-hidden
          />
          <span
            className="text-[11px] font-semibold leading-tight"
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

      <div className="grid grid-cols-3 gap-2">
        {CATEGORIES.map((c) => {
          const isSel = selected === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c.id)}
              className={cn(
                "flex h-[108px] flex-col items-center justify-start gap-1.5 border p-2 pt-2.5 transition-colors duration-150",
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
                  width={96}
                  height={40}
                  className="h-10 w-auto object-contain"
                />
              </span>
              <span className="text-center text-[11px] font-medium leading-tight">
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

const TRUST_BADGES = [
  { Icon: CheckCircle, t: "100% Gratuit", s: "sans engagement" },
  { Icon: ShieldCheck, t: "Professionnels vérifiés", s: "BCE & TVA" },
  { Icon: Lightbulb, t: "Conseils Primes", s: "infos sur les aides" },
] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Grille technique en fond — limitee au Hero (signature visuelle de
          la zone d'impact). Les autres sections de la LP vivent sur slate-50
          uni. Voir app/(public)/page.tsx pour le contexte. */}
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern"
        aria-hidden
      />

      {/* Fade vertical en bas du Hero : degrade de transparent vers slate-50.
          On garde 64px de hauteur totale pour que la transition reste douce
          (eviter une frontiere visible), mais on compresse la zone de fade
          *visible* aux 40% du bas (~26px) via un stop a 60% : 0-60% reste
          fully transparent (buffer invisible), 60-100% fait l'interpolation
          vers slate-50. Resultat : halo visible reduit sans demarcation.
          z-[5] : au-dessus de la grille et de la photo, sous le contenu (z-10). */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-16 bg-[linear-gradient(to_bottom,transparent_60%,#f8fafc_100%)]"
        aria-hidden
      />

      {/* DESKTOP — photo dans une zone bornee. Fade = overlay blanc degrade
          par-dessus la photo (pas de mask transparent). Le blanc opaque des
          bords se confond avec le bg blanc de la section -> blend parfait.
          LEVIERS :
            - left/right de la bande (position photo) en % du content max-w-[1350px]
            - paliers % du gradient overlay (largeur du blend)
            - alpha aux paliers (douceur de la courbe)

          Le wrapper exterieur centre la zone d'ancrage de la photo sur le
          meme container que le contenu (max-w-[1350px] mx-auto). Ainsi les %
          left/right sont relatifs a 1350px et restent stables sur viewports
          1280/1440/1920/2560+. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-full max-w-[1350px] -translate-x-1/2 lg:block"
        aria-hidden
      >
        <div
          className="absolute bottom-0 top-0"
          style={{ right: "0%", left: "auto", width: "830px" }}
        >
          {/* couche 1 : photo. Largeur d'image en PX fixe (et bande de
              largeur fixe ancrée à droite, sur le bord gauche du form) :
              l'artisan (~tiers gauche de l'image) reste collé au formulaire
              quels que soient le zoom/viewport. Avant, "auto 100%" derivait
              la largeur de la HAUTEUR => l'artisan glissait quand la hauteur
              ou la largeur du hero changeait. Calé en haut : tout ecart
              vertical tombe en bas (pieds) et est masque par le fade du bas.
              LEVIERS : width de la bande (point de contact avec le form) et
              backgroundSize (taille de l'artisan) — bouger les deux ensemble
              pour garder le contact (largeur_bande ≈ 0.315*largeur_image+454). */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/images/hero-artisan-800.webp')",
              backgroundSize: "1040px auto",
              backgroundRepeat: "no-repeat",
            }}
          />
          {/* couche 2 : overlay blanc horizontal *asymetrique*. Cote gauche :
              fade etendu sur 14% pour fondre proprement vers le bg blanc de
              la zone texte. Cote droit : fade tres court sur 6% car la
              FormCard recouvre deja cette zone -> pas la peine de manger de
              la photo avec un voile inutile. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, #ffffff 0%, rgba(255,255,255,0.65) 2%, rgba(255,255,255,0.30) 5%, rgba(255,255,255,0.10) 9%, rgba(255,255,255,0.02) 12%, rgba(255,255,255,0) 14%, rgba(255,255,255,0) 94%, rgba(255,255,255,0.20) 97%, rgba(255,255,255,0.65) 99%, #ffffff 100%)",
            }}
          />
          {/* couche 3 : overlay blanc vertical *asymetrique*. Pas de fade
              en haut (le cadrage de la photo n'en a pas besoin), uniquement
              vers le bas pour faire fondre les pieds de l'artisan dans le
              sol blanc. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.18) 80%, rgba(255,255,255,0.50) 88%, rgba(255,255,255,0.85) 95%, #ffffff 100%)",
            }}
          />
        </div>
      </div>

      {/* Pas de photo artisan sur mobile : la grille globale (1er layer)
          reste visible sur fond blanc, comme la zone texte desktop. */}

      <div className="relative mx-auto max-w-[1350px] px-6 pb-10 pt-10 lg:pb-5 lg:pt-5">
        <div className="grid min-h-[440px] items-start gap-6 lg:grid-cols-[1fr_auto] lg:gap-0">
          {/* GAUCHE — texte. LEVIER : max-w-[Xpx] pour la largeur du bloc */}
          <div className="relative z-10 flex max-w-[640px] flex-col lg:translate-y-8">
            <div className="inline-flex items-center gap-2 self-start">
              <BEFlag className="inline-block h-3 w-4 rounded-[1px]" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-700 sm:text-[11px] sm:tracking-[0.12em]">
                Plateforme belge de mise en relation pour vos travaux
              </span>
            </div>

            {/* Exception typo : ce h1 reste sur Plus_Jakarta_Sans (variable
                --font-display) pour son rendu specifique sur la baseline du
                Hero. Tout le reste de la LP utilise font-display = Bricolage
                Grotesque (cf. globals.css). */}
            <h1
              className="mt-2 text-[40px] font-extrabold leading-[1.05] sm:text-[44px] md:text-[54px] lg:text-[68px]"
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

            {/* max-w bornee a 470px sur desktop : la bande photo demarre a
                35% du conteneur (~470px) avec un fondu jusqu'a ~595px. Sans
                cette borne, le paragraphe (qui herite du max-w-[640px] du
                bloc) wrappe trop tard et la 2e ligne deborde sur la partie
                visible de la photo. Le titre, lui, ne touche que le bord
                fondu quasi-blanc -> pas de borne necessaire. */}
            <p className="mt-4 max-w-[470px] text-[15.5px] leading-relaxed text-slate-600">
              Décrivez votre projet en 2 minutes et recevez jusqu&apos;à 3 devis
              gratuits de professionnels vérifiés près de chez vous. Comparez,
              choisissez, c&apos;est tout.
            </p>

            {/* Trois badges de réassurance. Le bloc Trustpilot a été retiré
                (pas d'avis réels en V1). */}
            <div className="mt-8 w-full sm:w-fit">
              {/* Mobile : 3 colonnes centrées (icône au-dessus) pour remplir
                  la largeur. sm+ : rangée inline icône-à-gauche (inchangé). */}
              <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-row sm:flex-nowrap sm:items-center sm:gap-x-5">
                {TRUST_BADGES.map((b) => (
                  <div
                    key={b.t}
                    className="flex flex-col items-center gap-1 text-center sm:flex-row sm:items-center sm:gap-2 sm:text-left"
                  >
                    <span className="shrink-0" style={{ color: "#1e3a8a" }}>
                      <b.Icon size={20} weight="regular" aria-hidden />
                    </span>
                    <div className="leading-tight">
                      <div className="text-[12px] font-semibold text-slate-900 sm:text-[13.5px]">
                        {b.t}
                      </div>
                      <div className="mt-0.5 text-[10.5px] text-slate-500 sm:text-[12px]">
                        {b.s}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DROITE — form a droite, sans chevauchement photo */}
          <div className="relative z-10 flex w-full lg:w-auto lg:justify-end">
            <FormCard />
          </div>
        </div>
      </div>
    </section>
  );
}
