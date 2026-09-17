"use client";

import { useEffect, useState } from "react";

import { Reveal } from "@/components/ds/Reveal";
import { calculatePotential, PRO_ZONES } from "@/lib/potential-calculator";

type Metier = { slug: string; name: string };

type Props = { universes: Metier[] };

// Formateur au niveau module sans risque d'écart d'hydratation : le montant
// n'est rendu qu'après une sélection côté client, jamais au SSR.
const EUR_FMT = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function ProPotential({ universes }: Props) {
  const [metier, setMetier] = useState<string>("");
  const [zone, setZone] = useState<string>("");
  const potential = metier && zone ? calculatePotential(metier, zone) : null;

  return (
    <section id="potentiel" className="relative scroll-mt-20 lg:scroll-mt-24">
      <div className="mx-auto max-w-[1400px] px-6 py-12 lg:py-13">
        <Reveal>
          <div className="mb-8 max-w-[640px] lg:mb-10">
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
          {/* overflow-hidden : le panneau résultat déborde jusqu'aux bords de
              la card (marges négatives) et doit suivre son arrondi. */}
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
              <Field label="Je suis">
                <select
                  value={metier}
                  onChange={(e) => setMetier(e.target.value)}
                  className="h-12 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 text-[15px] text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                >
                  <option value="">Sélectionnez votre métier</option>
                  {universes.map((u) => (
                    <option key={u.slug} value={u.slug}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="À">
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="h-12 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 text-[15px] text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                >
                  <option value="">Sélectionnez votre ville</option>
                  {PRO_ZONES.map((z) => (
                    <option key={z.value} value={z.value}>
                      {z.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Panneau résultat pleine largeur, sur fond slate-50 pour se
                détacher du formulaire blanc. */}
            <div className="-mx-5 -mb-5 mt-6 bg-slate-50 px-5 py-6 lg:-mx-8 lg:-mb-8 lg:px-8 lg:py-8">
              {potential ? (
                <ResultReveal key={`${metier}|${zone}`}>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                    Potentiel estimé dans votre zone
                  </p>
                  <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-10">
                    <Stat
                      value={`${potential.leadsMin}–${potential.leadsMax}`}
                      label="leads / mois"
                    />
                    <Stat
                      value={`~${EUR_FMT.format(potential.chantierMoyen)}`}
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
                <p className="text-[15px] text-slate-500">
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

// Fondu court à chaque nouveau résultat (remonté via la `key` parente). Sous
// reduced-motion : apparition immédiate, setState différé en microtâche
// (règle react-hooks/set-state-in-effect).
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
