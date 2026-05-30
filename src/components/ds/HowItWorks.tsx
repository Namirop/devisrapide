import { Fragment } from "react";
import type { Icon } from "@phosphor-icons/react";
import {
  CheckCircle,
  PaperPlaneTilt,
  Pencil,
} from "@phosphor-icons/react/dist/ssr";

import { Reveal } from "./Reveal";
import { ProCallout } from "./ProCallout";

// "Comment ca marche ?" — 3 etapes en ligne avec rond numerote + icone +
// fleches entre les etapes. Pas de card autour. La colonne gauche se cale
// verticalement sur la hauteur du ProCallout (grid stretch + flex h-full).

const STEPS: ReadonlyArray<{
  title: string;
  text: string;
  Icon: Icon;
}> = [
  {
    title: "Décrivez votre besoin",
    text: "Expliquez votre projet en quelques clics. Cela ne prend que 2 minutes.",
    Icon: Pencil,
  },
  {
    title: "Recevez jusqu'à 3 devis",
    text: "Nous transmettons votre demande à nos artisans qualifiés disponibles.",
    Icon: PaperPlaneTilt,
  },
  {
    title: "Choisissez le meilleur",
    text: "Comparez les devis reçus et choisissez l'artisan qui vous convient le mieux.",
    Icon: CheckCircle,
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative scroll-mt-20 lg:scroll-mt-24">
      <div className="mx-auto max-w-[1350px] px-6 pt-14 pb-8 lg:py-10">
        <div className="grid gap-12 lg:grid-cols-[1.7fr_1fr] lg:gap-10">
          <Reveal>
            <div className="flex h-full flex-col">
              <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight lg:text-[36px]">
                <span className="text-slate-900">Comment ça </span>
                <span style={{ color: "#ea580c" }}>marche</span>
                <span className="text-slate-900">&nbsp;?</span>
              </h2>

              <div className="mt-6 ml-2 flex flex-1 items-center sm:ml-0 lg:mt-2">
                <div className="flex w-full flex-col items-start gap-8 sm:flex-row sm:items-start sm:gap-4">
                  {STEPS.map((s, i) => (
                    <Fragment key={s.title}>
                      <div className="group flex flex-1 cursor-default flex-col transition-transform duration-200 hover:-translate-y-1">
                        <div className="flex items-center gap-3">
                          <div className="grid h-11 w-11 place-items-center rounded-full border border-slate-300 bg-white text-[20px] font-semibold text-slate-700 transition-colors duration-200 group-hover:border-[#1e3a8a] group-hover:bg-[#1e3a8a] group-hover:text-white">
                            {i + 1}
                          </div>
                          <s.Icon
                            size={34}
                            weight="regular"
                            className="text-slate-700 transition-all duration-200 group-hover:scale-110 group-hover:text-[#1e3a8a]"
                            aria-hidden
                          />
                        </div>
                        <h3 className="font-display mt-5 text-[17px] font-bold leading-tight text-slate-900 transition-colors duration-200 group-hover:text-[#1e3a8a]">
                          {s.title}
                        </h3>
                        <p className="mt-2 text-[13.5px] leading-relaxed text-slate-500 sm:max-w-[260px]">
                          {s.text}
                        </p>
                      </div>
                      {i < STEPS.length - 1 && (
                        <svg
                          className="hidden h-4 w-12 shrink-0 self-center text-slate-400 sm:block"
                          viewBox="0 0 48 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <line x1="2" y1="8" x2="42" y2="8" />
                          <polyline points="36,3 42,8 36,13" />
                        </svg>
                      )}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <ProCallout />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
