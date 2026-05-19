import { Fragment } from "react";
import type { Icon } from "@phosphor-icons/react";
import {
  Bell,
  Check,
  UserCheck,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";

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
      <div className="mx-auto max-w-[1200px] px-6 py-16 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr] lg:gap-8">
          {/* Comment ça marche */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 lg:p-10">
            <h2 className="font-display text-center text-[24px] font-bold tracking-tight text-slate-900 lg:text-[28px]">
              Comment ça marche ?
            </h2>

            <div className="mt-8 flex w-full flex-col items-stretch gap-8 sm:mt-10 sm:flex-row sm:items-start sm:gap-2 lg:gap-3">
              {STEPS.map((s, i) => (
                <Fragment key={s.title}>
                  <div className="flex flex-1 flex-col items-center text-center">
                    <div className="relative">
                      <div
                        className="grid h-16 w-16 place-items-center rounded-full"
                        style={{ backgroundColor: "#dbeafe" }}
                      >
                        <s.Icon
                          size={28}
                          weight="regular"
                          style={{ color: "#1e3a8a" }}
                          aria-hidden
                        />
                      </div>
                      <span
                        className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full text-[12px] font-bold text-white ring-2 ring-slate-50"
                        style={{ backgroundColor: "#1e3a8a" }}
                      >
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="mt-5 text-[14px] font-bold leading-tight text-slate-900">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500 sm:max-w-[180px]">
                      {s.text}
                    </p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <svg
                      className="mt-7 hidden h-4 w-8 shrink-0 text-slate-400 sm:block lg:w-10"
                      viewBox="0 0 32 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <line x1="2" y1="8" x2="26" y2="8" />
                      <polyline points="22,3 28,8 22,13" />
                    </svg>
                  )}
                </Fragment>
              ))}
            </div>
          </div>

          {/* Gardez le contrôle */}
          <aside
            className="rounded-2xl border p-6 sm:p-8 lg:p-10"
            style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }}
          >
            <h3 className="font-display text-[20px] font-bold tracking-tight text-slate-900 lg:text-[22px]">
              Gardez le contrôle !
            </h3>
            <ul className="mt-6 space-y-4">
              {CONTROLS.map((c) => (
                <li
                  key={c}
                  className="flex items-start gap-3 text-[14px] leading-snug text-slate-700"
                >
                  <span
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full"
                    style={{ backgroundColor: "#22c55e" }}
                    aria-hidden
                  >
                    <Check size={14} weight="bold" className="text-white" />
                  </span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
