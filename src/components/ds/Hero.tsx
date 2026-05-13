"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle,
  Lightbulb,
  ShieldCheck,
} from "@phosphor-icons/react";

import { BEFlag } from "./BEFlag";
import { TrustpilotBadgeCompact } from "./TrustpilotBadgeCompact";
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
  const [selected, setSelected] = useState<CategoryId | null>("sos");

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
      className="w-full lg:w-[430px] rounded-md border border-slate-200/70 bg-white p-8 lg:p-6 "
      style={{
        boxShadow:
          "0 20px 40px -12px rgba(15, 23, 42, 0.22), 0 6px 16px -6px rgba(15, 23, 42, 0.10)",
      }}
      noValidate
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-[23px] font-bold leading-[1.1] tracking-tight text-slate-900">
            Décrivez votre besoin
            <br />
            en 2 minutes
          </h2>
          <p className="mt-2 text-[14px] text-slate-500">
            Gratuit, rapide et sans engagement
          </p>
        </div>
        <span
          className="inline-flex shrink-0 flex-col items-center rounded-md px-2 py-2"
          style={{ backgroundColor: "#eff6ff" }}
        >
          <span
            className="font-display text-[14px] font-bold leading-none"
            style={{ color: "rgb(11, 37, 107)" }}
          >
            +127
          </span>
          <span
            className="text-[11px] font-medium"
            style={{ color: "#1e40af" }}
          >
            demandes ce mois
          </span>
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 items-center gap-2 text-center">
        {[
          { n: 1, label: "Votre besoin" },
          { n: 2, label: "Vos infos" },
          { n: 3, label: "C'est envoyé" },
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
      <div className="mt-4 mb-4 h-px bg-slate-100" />

      <div className="mb-2.5 text-[15px] font-semibold text-slate-900">
        Quel type de service recherchez-vous ?
      </div>

      <div className="grid grid-cols-3 gap-2">
        {CATEGORIES.map((c) => {
          const isSel = selected === c.id;
          const Icon = c.Icon;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c.id)}
              className={cn(
                "flex h-[100px] flex-col items-center justify-center gap-1 border p-2 transition-colors duration-150",
                isSel
                  ? c.urgent
                    ? "border-[#ea580c] bg-orange-50 text-[#ea580c]"
                    : "border-[#1e3a8a] bg-blue-50 text-[#1e3a8a]"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
              )}
              aria-pressed={isSel}
            >
              <Icon size={34} weight="regular" aria-hidden />
              <span className="text-center text-[12px] font-medium leading-tight">
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
  { Icon: ShieldCheck, t: "Artisans vérifiés", s: "notés par nos clients" },
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
          style={{ left: "35%", right: "0%" }}
        >
          {/* couche 1 : photo plein cadre */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/images/hero-artisan-800.webp')",
              backgroundSize: "auto 100%",
              backgroundRepeat: "no-repeat",
            }}
          />
          {/* couche 2 : overlay blanc qui masque les bords. Le centre est
              transparent (photo visible), les cotes sont blancs (= bg). */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, #ffffff 0%, rgba(255,255,255,0.80) 3%, rgba(255,255,255,0.30) 9.5%, rgba(255,255,255,0.065) 16%, rgba(255,255,255,0) 22%, rgba(255,255,255,0) 78%, rgba(255,255,255,0.065) 84%, rgba(255,255,255,0.30) 90.5%, rgba(255,255,255,0.80) 97%, #ffffff 100%)",
            }}
          />
        </div>
      </div>

      {/* MOBILE — photo en background discret avec voile clair par-dessus */}
      <div
        className="pointer-events-none absolute inset-0 lg:hidden"
        aria-hidden
      >
        <img
          src="/images/hero-artisan-400.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-20"
          style={{ objectPosition: "center 20%" }}
        />
        <div className="absolute inset-0 bg-white/85" />
      </div>

      <div className="relative mx-auto max-w-[1350px] px-6 pb-10 pt-10 lg:pb-5 lg:pt-5">
        <div className="grid min-h-[500px] items-start gap-6 lg:grid-cols-[1fr_auto] lg:gap-0">
          {/* GAUCHE — texte. LEVIER : max-w-[Xpx] pour la largeur du bloc */}
          <div className="relative z-10 flex max-w-[640px] flex-col lg:translate-y-8">
            <div className="inline-flex items-center gap-2 self-start">
              <BEFlag className="inline-block h-3 w-4 rounded-[1px]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                LA PLATEFORME N°1 EN BELGIQUE POUR VOS TRAVAUX
              </span>
            </div>

            <h1
              className="font-display mt-2 text-[48px] font-extrabold leading-[1.05] sm:text-[54px] lg:text-[68px]"
              style={{
                color: "#1e3a8a",
                letterSpacing: "-0.035em",
              }}
            >
              <span className="block">Le bon artisan,</span>
              <span className="block">sans téléphoner</span>
              <span
                className="block whitespace-nowrap"
                style={{ color: "#ea580c" }}
              >
                à quinze numéros.
              </span>
            </h1>

            <p className="mt-4 text-[15.5px] leading-relaxed text-slate-600">
              Décrivez votre besoin en 2 minutes et recevez jusqu&apos;à 3 devis
              <br />
              gratuits d&apos;artisans vérifiés près de chez vous.
              <br />
              Comparez, choisissez, c&apos;est tout.
            </p>

            {/* Trust badges + Trustpilot, wrapper w-fit pour que le badge
                Trustpilot (w-full) prenne la meme largeur que la ligne
                des 3 badges au-dessus. */}
            <div className="mt-8 w-fit">
              <div className="flex flex-nowrap items-center gap-x-5">
                {TRUST_BADGES.map((b) => (
                  <div key={b.t} className="flex items-center gap-2">
                    <span className="shrink-0" style={{ color: "#1e3a8a" }}>
                      <b.Icon size={20} weight="regular" aria-hidden />
                    </span>
                    <div className="leading-tight">
                      <div className="text-[13.5px] font-semibold text-slate-900">
                        {b.t}
                      </div>
                      <div className="mt-0.5 text-[12px] text-slate-500">
                        {b.s}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <TrustpilotBadgeCompact />
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
