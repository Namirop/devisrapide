"use client";

import { useState } from "react";

import { Reveal } from "@/components/ds/Reveal";
import { getPotentialRange, PRO_CITIES } from "@/lib/pro-potential";

type Category = { id: string; name: string; slug: string };

type Props = { categories: Category[] };

export function ProPotential({ categories }: Props) {
  const [categorySlug, setCategorySlug] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const range =
    categorySlug && city ? getPotentialRange(categorySlug, city) : null;

  return (
    <section id="potentiel" className="relative scroll-mt-20 lg:scroll-mt-24">
      <div className="mx-auto max-w-[1350px] px-6 py-12 lg:py-13">
        <Reveal>
          <div className="mb-10 max-w-[640px]">
            <h2 className="font-display text-[32px] font-bold tracking-tight text-slate-900 sm:text-[38px] lg:text-[52px]">
              Quel est votre{" "}
              <span style={{ color: "#ea580c" }}>potentiel</span> ?
            </h2>
            <p className="text-[14.5px] text-slate-500">
              Une estimation basée sur votre métier et votre zone
              d&apos;intervention.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
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

            {/* Bloc resultat dans le MEME bloc form (plus d'aside navy ni de
                "1 lead a 40 €" : §2 container vide retire). Etat vide = texte
                editorial minimal ; apres selection = resultat enrichi sur 2
                lignes. Separation par un simple filet haut, pas de sous-card
                habillee (cf. anti-ai-design-patterns). */}
            <div className="mt-7 border-t border-slate-100 pt-7">
              {range ? (
                <>
                  <p className="text-balance text-[40px] font-extrabold leading-[1.04] tracking-tight text-slate-900 sm:text-[52px] lg:text-[60px]">
                    <span className="tabular-nums" style={{ color: "#1e3a8a" }}>
                      {range.min} à {range.max}
                    </span>{" "}
                    demandes par mois dans votre zone
                  </p>
                  <p className="mt-5 max-w-[560px] text-[15px] leading-relaxed text-slate-500">
                    Soit potentiellement plusieurs milliers d&apos;euros de
                    chantiers par mois. Pas d&apos;abonnement, vous choisissez
                    chaque lead.
                  </p>
                </>
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
