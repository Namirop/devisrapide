"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CheckCircle, ShieldCheck, Lightbulb } from "lucide-react";
import { BEFlag } from "./BEFlag";
import { Button } from "@/components/ui/button";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { cn } from "@/lib/utils";

// Hero V7 — port direct depuis _archive/design-source-v3-final.
// Photo en background-image sur la moitie droite (left 36% → 100%)
// avec fondus gauche/bas/haut pour fusion avec bg slate-50.
// Form chevauche la photo (lg:-ml-12) avec shadow-xl prononcee.
// Valeurs finales du proto + ajustements visuels integres :
//   - gradient gauche w-[180px], opacites 0.95 / 0.6 / 0
//   - gradient bas h-[120px]
//   - min-h-[700px]
//   - backgroundSize: auto 120%
//   - backgroundPosition: -2% center

function FormCard() {
  const router = useRouter();
  const [selected, setSelected] = useState<CategoryId | null>("sos");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const cat = CATEGORIES.find((c) => c.id === selected)!;
    const params = new URLSearchParams(
      cat.id === "sos"
        ? { universe: "sos-depannage" }
        : { universe: "travaux", category: cat.id },
    );
    router.push(`/demande?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[600px] rounded-md border border-slate-200/70 bg-white p-7 lg:p-8"
      style={{
        boxShadow:
          "0 20px 40px -12px rgba(15, 23, 42, 0.22), 0 6px 16px -6px rgba(15, 23, 42, 0.10)",
      }}
      noValidate
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[19px] font-bold leading-snug tracking-tight text-slate-900 lg:text-[20px]">
            Décrivez votre besoin
            <br />
            en 2 minutes
          </h2>
          <p className="mt-1 text-[12.5px] text-slate-500">
            Gratuit, rapide et sans engagement
          </p>
        </div>
        <span
          className="inline-flex shrink-0 flex-col items-end rounded-md px-2.5 py-1.5"
          style={{ backgroundColor: "#eff6ff" }}
        >
          <span
            className="text-[13px] font-bold leading-none"
            style={{ color: "#1e3a8a" }}
          >
            +127
          </span>
          <span
            className="mt-0.5 text-[10px] font-medium"
            style={{ color: "#1e40af" }}
          >
            demandes ce mois
          </span>
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 items-center gap-2 text-center">
        {[
          { n: 1, label: "Votre besoin" },
          { n: 2, label: "Vos infos" },
          { n: 3, label: "C'est envoyé" },
        ].map((s) => {
          const active = s.n === 1;
          return (
            <div key={s.n} className="flex flex-col items-center">
              <div
                className={cn(
                  "grid h-7 w-7 place-items-center text-[12px] font-semibold",
                  active
                    ? "bg-[#1e3a8a] text-white"
                    : "border border-slate-200 bg-white text-slate-400",
                )}
              >
                {s.n}
              </div>
              <div
                className={cn(
                  "mt-1.5 text-[10.5px] font-medium",
                  active ? "text-slate-900" : "text-slate-400",
                )}
              >
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 mb-4 h-px bg-slate-100" />

      <div className="mb-2.5 text-[13.5px] font-semibold text-slate-900">
        Quel type de service recherchez-vous&nbsp;?
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
                "flex h-[68px] flex-col items-center justify-center gap-1 border p-2 transition-colors duration-150",
                isSel
                  ? c.urgent
                    ? "border-[#ea580c] bg-orange-50 text-[#ea580c]"
                    : "border-[#1e3a8a] bg-blue-50 text-[#1e3a8a]"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
              )}
              aria-pressed={isSel}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
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
        className="mt-4 h-11 w-full text-[14px] font-semibold"
      >
        Continuer
        <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
      </Button>

      <div className="mt-3 flex items-center justify-center gap-4 text-[11.5px] text-slate-500">
        {["Sans inscription", "Gratuit", "Réponse rapide"].map((t) => (
          <span key={t} className="inline-flex items-center gap-1">
            <Check
              className="h-[13px] w-[13px] text-[#16a34a]"
              strokeWidth={2.5}
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
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: "#f8fafc" }}
    >
      {/* DESKTOP — photo plein bleed sur la moitie droite, full hauteur.
          background-image (pas <Image>) pour permettre backgroundSize > 100%
          et decaler reellement l'artisan vers la gauche. */}
      <div
        className="pointer-events-none absolute bottom-0 top-0 hidden lg:block"
        style={{ left: "36%", right: 0 }}
        aria-hidden
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/images/hero-artisan-800.webp')",
            backgroundSize: "auto 120%",
            backgroundPosition: "-2% center",
            backgroundRepeat: "no-repeat",
          }}
        />
        {/* Fondu bord gauche : slate-50 → transparent (w-180 + courbe douce) */}
        <div
          className="absolute inset-y-0 left-0 w-[180px]"
          style={{
            background:
              "linear-gradient(to right, #f8fafc 0%, rgba(248,250,252,0.95) 25%, rgba(248,250,252,0.6) 60%, rgba(248,250,252,0) 100%)",
          }}
        />
        {/* Fondu bord bas (h-120 pour fusion douce avec sections suivantes) */}
        <div
          className="absolute inset-x-0 bottom-0 h-[120px]"
          style={{
            background:
              "linear-gradient(to top, #f8fafc 0%, rgba(248,250,252,0) 100%)",
          }}
        />
        {/* Fondu bord haut tres leger */}
        <div
          className="absolute inset-x-0 top-0 h-[40px]"
          style={{
            background:
              "linear-gradient(to bottom, rgba(248,250,252,0.5) 0%, rgba(248,250,252,0) 100%)",
          }}
        />
      </div>

      {/* MOBILE — photo en background discret avec voile clair par-dessus */}
      <div
        className="pointer-events-none absolute inset-0 lg:hidden"
        aria-hidden
      >
        <img
          src="/images/hero-artisan-400.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25"
          style={{ objectPosition: "center 20%" }}
        />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(248,250,252,0.85)" }}
        />
      </div>

      <div className="relative mx-auto max-w-[1280px] px-6 pb-10 pt-10 lg:pb-14 lg:pt-14">
        <div className="grid min-h-[700px] items-center gap-6 lg:grid-cols-[1fr_auto] lg:gap-0">
          {/* GAUCHE — texte */}
          <div className="flex max-w-[460px] flex-col">
            <div
              className="inline-flex items-center gap-2 self-start rounded-md px-3 py-1.5"
              style={{ backgroundColor: "#fef3e2" }}
            >
              <BEFlag className="inline-block h-3 w-4 rounded-[1px]" />
              <span
                className="text-[10.5px] font-semibold uppercase tracking-[0.10em]"
                style={{ color: "#ea580c" }}
              >
                La plateforme N°1 en Belgique
              </span>
            </div>

            <h1
              className="mt-5 text-[36px] font-bold leading-[1.05] tracking-tight sm:text-[40px] lg:text-[46px]"
              style={{ color: "#1e3a8a" }}
            >
              <span className="block">Le bon artisan,</span>
              <span className="block">sans téléphoner</span>
              <span className="block" style={{ color: "#ea580c" }}>
                à quinze numéros.
              </span>
            </h1>

            <p className="mt-4 text-[14.5px] leading-relaxed text-slate-600">
              Décrivez votre besoin en 2 minutes et recevez jusqu&apos;à 3
              devis gratuits d&apos;artisans vérifiés près de chez vous.
            </p>

            {/* Trust badges + 100% Belge en bout de ligne */}
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              {TRUST_BADGES.map((b) => (
                <div key={b.t} className="flex items-center gap-2">
                  <span className="shrink-0" style={{ color: "#1e3a8a" }}>
                    <b.Icon
                      className="h-[18px] w-[18px]"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </span>
                  <div className="leading-tight">
                    <div className="text-[12.5px] font-semibold text-slate-900">
                      {b.t}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {b.s}
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <BEFlag className="inline-block h-3 w-4 shrink-0 rounded-[1px]" />
                <div className="leading-tight">
                  <div className="text-[12.5px] font-semibold text-slate-900">
                    Plateforme 100% Belge
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    basée à Bruxelles
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DROITE — form qui chevauche la photo */}
          <div className="relative flex w-full lg:-ml-12 lg:z-10 lg:w-auto lg:justify-end">
            <FormCard />
          </div>
        </div>
      </div>
    </section>
  );
}
