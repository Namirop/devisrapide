"use client";

import { useState } from "react";
import { Briefcase, MapPin, TrendUp } from "@phosphor-icons/react/dist/ssr";

import { Reveal } from "@/components/ds/Reveal";
import { getPotentialRange, PRO_CITIES } from "@/lib/pro-potential";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; slug: string };

type Props = { categories: Category[] };

export function ProPotential({ categories }: Props) {
  const [categorySlug, setCategorySlug] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const range =
    categorySlug && city ? getPotentialRange(categorySlug, city) : null;

  return (
    <section id="potentiel" className="relative scroll-mt-20 lg:scroll-mt-24">
      <div className="mx-auto max-w-[1350px] px-6 py-12 lg:py-20">
        <Reveal>
        <div className="mb-10 text-center">
          <span
            className="text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] sm:tracking-[0.16em]"
            style={{ color: "#ea580c" }}
          >
            Estimation
          </span>
          <h2 className="font-display mt-3 text-[28px] font-bold tracking-tight text-slate-900 lg:text-[36px]">
            Quel est votre potentiel ?
          </h2>
          <p className="mt-3 text-[14.5px] text-slate-500">
            Une estimation basée sur votre métier et votre zone d&apos;intervention.
          </p>
        </div>
        </Reveal>

        <Reveal delay={120}>
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Je suis" Icon={Briefcase}>
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
              <Field label="À" Icon={MapPin}>
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

            <div
              className={cn(
                "mt-6 rounded-md border p-5 transition-colors duration-200",
                range
                  ? "border-[#1e3a8a]/20 bg-blue-50/40"
                  : "border-dashed border-slate-200 bg-slate-50/40",
              )}
            >
              {range ? (
                <>
                  <div className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">
                    Potentiel estimé
                  </div>
                  <div
                    className="mt-2 text-[34px] font-extrabold leading-none tracking-tight lg:text-[44px]"
                    style={{ color: "#1e3a8a" }}
                  >
                    {range.min}{" "}
                    <span className="text-[20px] text-slate-400">à</span>{" "}
                    {range.max}
                  </div>
                  <div className="mt-1.5 text-[13.5px] text-slate-600">
                    demandes par mois dans votre zone
                  </div>
                  <p className="mt-4 text-[12px] text-slate-500">
                    Estimation basée sur votre zone et votre activité.
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-3 text-[14px] text-slate-500">
                  <TrendUp size={20} weight="regular" aria-hidden />
                  Sélectionnez un métier et une ville pour voir votre
                  estimation.
                </div>
              )}
            </div>
          </div>

          <aside
            className="flex flex-col justify-center rounded-lg p-6 text-white lg:p-8"
            style={{ backgroundColor: "#ea580c" }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
              Le calcul est vite fait
            </div>
            <div className="mt-3 text-[36px] font-extrabold leading-none tracking-tight">
              1 lead à 40 €
            </div>
            <p className="mt-4 text-[14.5px] leading-relaxed text-white/90">
              peut déboucher sur plusieurs{" "}
              <strong>milliers d&apos;euros</strong> de travaux pour votre
              entreprise.
            </p>
            <p className="mt-3 text-[12.5px] text-white/70">
              Pas d&apos;abonnement, pas de revente massive du contact —
              vous choisissez chaque chantier.
            </p>
          </aside>
        </div>
        </Reveal>
      </div>
    </section>
  );
}

function Field({
  label,
  Icon,
  children,
}: {
  label: string;
  Icon: React.ComponentType<{
    size?: number;
    weight?: "thin" | "light" | "regular" | "bold";
    "aria-hidden"?: boolean;
  }>;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-slate-500">
        <Icon size={14} weight="bold" aria-hidden />
        {label}
      </span>
      {children}
    </label>
  );
}
