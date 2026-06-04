import { Fragment } from "react";
import type { Icon } from "@phosphor-icons/react";
import { Bell, UserCheck, Wallet } from "@phosphor-icons/react/dist/ssr";

import { Reveal } from "@/components/ds/Reveal";

// "Comment ca marche" — meme pattern que la LP particulier (HowItWorks.tsx) :
// 3 etapes en ligne (rond numerote borde + icone nue + fleches entre), aucune
// card. Une seule composition pleine largeur : titre aligne gauche, etapes,
// puis une ligne editoriale "Vous gardez le controle" SOUS les etapes —
// l'ancienne aside navy a checks a ete fusionnee ici en texte nu (cf.
// anti-ai-design-patterns : §2 container vide habille, §6 checks decoratifs).

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

export function ProHowItWorks() {
  return (
    <section id="comment" className="relative scroll-mt-20 lg:scroll-mt-24">
      <div className="mx-auto max-w-[1350px] px-6 py-12 lg:py-13">
        <Reveal>
          <h2 className="font-display text-[32px] font-bold tracking-tight text-slate-900 sm:text-[38px] lg:text-[52px]">
            Comment ça <span style={{ color: "#ea580c" }}>marche</span>&nbsp;?
          </h2>
        </Reveal>

        <Reveal delay={120}>
          <div className="mx-auto mt-10 flex w-full max-w-[980px] flex-col items-start gap-8 sm:flex-row sm:items-start sm:gap-4">
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
        </Reveal>

        {/* Ancienne aside "Gardez le controle !" fusionnee ici en une ligne
            editoriale nue : pas de card, pas de check, pas d'eyebrow. Marge
            top genereuse (~56px) pour la detacher des etapes sans la noyer. */}
        <Reveal delay={200}>
          <p className="mt-14 max-w-[760px] text-[16px] leading-relaxed text-slate-500 lg:text-[17px]">
            Vous gardez le contrôle : choisissez vos zones et vos métiers,
            activez l&apos;auto-accept, mettez en pause quand vous voulez.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
