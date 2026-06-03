import { Fragment } from "react";
import type { Icon } from "@phosphor-icons/react";
import { Bell, Check, UserCheck, Wallet } from "@phosphor-icons/react/dist/ssr";

import { Reveal } from "@/components/ds/Reveal";

const STEPS: ReadonlyArray<{
  title: string;
  text: string;
  Icon: Icon;
}> = [
  {
    title: "Créez votre profil",
    text: "2 minutes suffisent. Gratuit, validé sous 24h.",
    Icon: UserCheck,
  },
  {
    title: "Rechargez votre wallet",
    text: "Packs flexibles sans engagement.",
    Icon: Wallet,
  },
  {
    title: "Recevez et choisissez",
    text: "Vous restez libre d'accepter ou refuser.",
    Icon: Bell,
  },
];

const CONTROLS: ReadonlyArray<string> = [
  "Choisissez votre zone d'intervention",
  "Sélectionnez vos métiers",
  "Activez l'Auto-Accept",
  "Mettez votre compte en pause quand vous voulez",
];

export function ProHowItWorks() {
  return (
    <section id="comment" className="relative scroll-mt-20 lg:scroll-mt-24">
      <div className="mx-auto max-w-[1200px] px-6 py-12 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr] lg:gap-8">
          <Reveal>
          {/* Comment ça marche — meme pattern visuel que la LP particulier
              (HowItWorks.tsx) : pas de card, titre aligne gauche, etapes
              avec rond numerote borde + icone nue inline. Fichier garde
              independant (variations futures possibles) — seul le pattern
              est copie, pas le contenu. */}
          <div className="flex h-full flex-col">
            <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight lg:text-[36px]">
              <span className="text-slate-900">Comment ça </span>
              <span style={{ color: "#ea580c" }}>marche</span>
              <span className="text-slate-900">&nbsp;?</span>
            </h2>

            <div className="mt-6 flex flex-1 items-center lg:mt-2">
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
                      <p className="mt-2 text-[13.5px] leading-relaxed text-slate-500 sm:max-w-[220px]">
                        {s.text}
                      </p>
                    </div>
                    {i < STEPS.length - 1 && (
                      <svg
                        className="hidden h-4 w-10 shrink-0 self-center text-slate-400 sm:block"
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
          {/* Gardez le contrôle */}
          <aside className="rounded-2xl border border-[#1e3a8a]/15 bg-[#1e3a8a]/[0.04] p-6 sm:p-8 lg:p-10">
            <h3 className="font-display text-[20px] font-bold tracking-tight text-slate-900 lg:text-[22px]">
              Gardez le contrôle !
            </h3>
            <ul className="mt-6 space-y-4">
              {CONTROLS.map((c) => (
                <li
                  key={c}
                  className="flex items-start gap-3 text-[14px] leading-snug text-slate-700"
                >
                  <Check
                    size={18}
                    weight="bold"
                    className="mt-0.5 shrink-0 text-[#1e3a8a]"
                    aria-hidden
                  />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </aside>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
