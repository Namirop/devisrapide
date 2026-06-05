"use client";

import { useEffect, useState } from "react";

import { Reveal } from "@/components/ds/Reveal";
import {
  getAvgJobValueEur,
  getPotentialRange,
  PRO_CITIES,
} from "@/lib/pro-potential";

type Category = { id: string; name: string; slug: string };

type Props = { categories: Category[] };

// Separateur de milliers deterministe (espace insecable). Pas toLocaleString :
// l'ICU diverge entre Node (SSR) et navigateur → risque de mismatch hydration.
function formatThousands(n: number): string {
  return n
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, String.fromCharCode(160));
}

export function ProPotential({ categories }: Props) {
  const [categorySlug, setCategorySlug] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const range =
    categorySlug && city ? getPotentialRange(categorySlug, city) : null;
  const jobValueEur = range ? getAvgJobValueEur(categorySlug) : null;

  return (
    <section id="potentiel" className="relative scroll-mt-20 lg:scroll-mt-24">
      <div className="mx-auto max-w-[1400px] px-6 py-12 lg:py-13">
        <Reveal>
          <div className="mb-10 max-w-[640px]">
            <h2 className="font-display text-[28px] font-bold tracking-tight text-slate-900 lg:text-[36px]">
              Quel est votre <span style={{ color: "#ea580c" }}>potentiel</span>{" "}
              ?
            </h2>
            <p className="text-[14.5px] text-slate-500">
              Une estimation basée sur votre métier et votre zone
              d&apos;intervention.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          {/* overflow-hidden : le panneau resultat deborde jusqu'aux bords
              internes de la card (negative margins) et doit etre clippe par
              le rayon de la card. */}
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Je suis">
                <select
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  className="h-12 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 text-[14px] text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                >
                  <option value="">Sélectionnez votre métier</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="À">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-12 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 text-[14px] text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                >
                  <option value="">Sélectionnez votre ville</option>
                  {PRO_CITIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Panneau resultat "ecran de lecture" : deborde aux bords de la
                card (negative margins = padding de la card), fond slate-50 pour
                retomber au niveau de la page et trancher avec le form blanc.
                Etat vide = placeholder ; apres selection = 2 chiffres XXL facon
                mini-dashboard de calcul. */}
            <div className="-mx-6 -mb-6 mt-7 bg-slate-50 px-6 py-7 lg:-mx-8 lg:-mb-8 lg:px-8 lg:py-8">
              {range && jobValueEur !== null ? (
                <ResultReveal key={`${categorySlug}|${city}`}>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                    Potentiel estimé dans votre zone
                  </p>
                  <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-10">
                    <Stat
                      value={`${range.min}–${range.max}`}
                      label="leads / mois"
                    />
                    <Stat
                      value={`~${formatThousands(jobValueEur)} €`}
                      label="valeur moyenne d'un chantier"
                    />
                  </div>
                  <div className="mt-7 border-t border-slate-200/70 pt-6">
                    <p className="max-w-[700px] text-[14.5px] leading-relaxed text-slate-500">
                      Soit potentiellement plusieurs milliers d&apos;euros de
                      chantiers par mois pour votre entreprise.
                    </p>
                    <p className="mt-2 text-[13px] text-slate-400">
                      Pas d&apos;abonnement, vous choisissez chaque lead.
                    </p>
                  </div>
                </ResultReveal>
              ) : (
                <p className="text-[14px] text-slate-500">
                  Sélectionnez un métier et une ville pour voir votre
                  estimation.
                </p>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// Libelle a DROITE du chiffre (centre verticalement) : chiffre XXL a gauche,
// le libelle s'empile sur 2-3 lignes a hauteur du chiffre, a sa droite.
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-3.5">
      <span
        className="shrink-0 text-[40px] font-extrabold leading-none tracking-tight tabular-nums sm:text-[54px] lg:text-[64px]"
        style={{ color: "#1e3a8a" }}
      >
        {value}
      </span>
      <span className="w-[84px] shrink-0 text-[13px] leading-snug text-slate-500">
        {label}
      </span>
    </div>
  );
}

// Fade-up court (~320ms) au montage du resultat. Remonte a chaque nouvelle
// selection via la `key` parente → le calcul parait "vivant". Meme garde-fou
// que Reveal : sous reduced-motion, apparition immediate sans transition ;
// setState differe d'un tick (regle react-hooks/set-state-in-effect du repo).
function ResultReveal({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ shown: boolean; animate: boolean }>({
    shown: false,
    animate: false,
  });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      queueMicrotask(() => setState({ shown: true, animate: false }));
      return;
    }
    const id = requestAnimationFrame(() =>
      setState({ shown: true, animate: true }),
    );
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      style={{
        opacity: state.shown ? 1 : 0,
        transform: state.shown ? "none" : "translateY(10px)",
        transition: state.animate
          ? "opacity 320ms cubic-bezier(0.22,1,0.36,1), transform 320ms cubic-bezier(0.22,1,0.36,1)"
          : undefined,
      }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
