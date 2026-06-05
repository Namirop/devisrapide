import { Fragment } from "react";
import type { Icon } from "@phosphor-icons/react";
import { Bell, Check, UserCheck, Wallet } from "@phosphor-icons/react/dist/ssr";

import { Reveal } from "@/components/ds/Reveal";

// "Comment ca marche" — MEME structure que la LP particulier (HowItWorks.tsx) :
// grille [1.7fr_1fr], a gauche titre + 3 etapes en ligne (rond numerote borde +
// icone nue + fleches entre, aucune card) ; a droite un callout navy. Les
// etapes sont resserrees par la colonne 1.7fr (au lieu d'occuper toute la
// largeur). Le callout reprend "Vous gardez le controle" (ex-ligne editoriale)
// pour calquer le ProCallout du particulier.

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

const CONTROL_POINTS: ReadonlyArray<string> = [
  "Choisissez vos zones et vos métiers",
  "Activez l'auto-accept pour ne rien rater",
  "Mettez en pause quand vous voulez",
];

export function ProHowItWorks() {
  return (
    <section id="comment" className="relative scroll-mt-20 lg:scroll-mt-24">
      <div className="mx-auto max-w-[1400px] px-6 py-12 lg:py-13">
        <div className="grid gap-12 lg:grid-cols-[1.7fr_1fr] lg:gap-10">
          <Reveal>
            <div className="flex h-full flex-col">
              <h2 className="font-display text-[28px] font-bold tracking-tight text-slate-900 lg:text-[36px]">
                Comment ça <span style={{ color: "#ea580c" }}>marche</span>
                &nbsp;?
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

          {/* Callout navy droite — calque du ProCallout du particulier, contenu
              pro ("Vous gardez le controle"). */}
          <Reveal delay={120}>
            <div
              className="group relative h-full overflow-hidden rounded-lg text-white shadow-sm"
              style={{ backgroundColor: "#1e3a8a" }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-25"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 110% 20%, rgba(255,255,255,0.18), transparent 45%), radial-gradient(circle at 95% 95%, rgba(234,88,12,0.35), transparent 50%)",
                }}
              />
              {/* Filigrane "table de mixage" : au hover du callout, les curseurs
                  montent/descendent (cascade). */}
              <div
                className="pointer-events-none absolute bottom-3 right-3 grid h-32 w-32 place-items-center rounded-full bg-white/5"
                aria-hidden
              >
                <FadersAnimated />
              </div>

              <div className="relative flex h-full flex-col p-5 lg:p-6">
                <h3 className="font-display text-[18px] font-bold tracking-tight lg:text-[20px]">
                  Vous gardez le contrôle
                </h3>
                <p className="mt-1.5 max-w-[300px] text-[12.5px] leading-relaxed text-white/75">
                  Vous pilotez vos leads de bout en bout, sans engagement.
                </p>
                <ul className="mt-4 space-y-2">
                  {CONTROL_POINTS.map((t) => (
                    <li
                      key={t}
                      className="flex items-center gap-2 text-[12.5px] text-white/90"
                    >
                      <Check
                        size={15}
                        weight="bold"
                        className="text-[#fb923c]"
                        aria-hidden
                      />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// Filigrane "table de mixage" anime (HTML, pas SVG, pour des transforms CSS
// fiables). 3 pistes verticales + curseurs ; au group-hover du callout, chaque
// curseur translate en Y (cascade via delais) = effet "on regle les niveaux".
function FadersAnimated() {
  return (
    <div className="flex h-[80px] items-stretch gap-[22px] text-white/20 transition-colors duration-500 group-hover:text-white/35">
      <div className="relative w-[3px] rounded-full bg-current">
        <span className="absolute left-1/2 top-[6px] h-[11px] w-[22px] -translate-x-1/2 rounded-full bg-current transition-transform duration-500 ease-out group-hover:translate-y-[36px]" />
      </div>
      <div className="relative w-[3px] rounded-full bg-current">
        <span className="absolute left-1/2 top-[42px] h-[11px] w-[22px] -translate-x-1/2 rounded-full bg-current transition-transform delay-100 duration-500 ease-out group-hover:-translate-y-[30px]" />
      </div>
      <div className="relative w-[3px] rounded-full bg-current">
        <span className="absolute left-1/2 top-[20px] h-[11px] w-[22px] -translate-x-1/2 rounded-full bg-current transition-transform delay-200 duration-500 ease-out group-hover:translate-y-[30px]" />
      </div>
    </div>
  );
}
