import { Fragment } from "react";
import {
  UserCheck,
  Wallet,
  Bell,
  MapPin,
  Briefcase,
  Power,
  PauseCircle,
  type LucideIcon,
} from "lucide-react";

const STEPS: ReadonlyArray<{
  title: string;
  text: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Créez votre profil",
    text: "2 minutes pour vous inscrire. Gratuit, validé manuellement sous 24h.",
    Icon: UserCheck,
  },
  {
    title: "Rechargez votre wallet",
    text: "Choisissez un pack (70 €, 300 €, 800 €) avec bonus de recharge. Sans abonnement.",
    Icon: Wallet,
  },
  {
    title: "Recevez et choisissez",
    text: "Alertes en temps réel. Acceptez ou refusez chaque chantier en un clic.",
    Icon: Bell,
  },
];

const CONTROLS: ReadonlyArray<{ title: string; Icon: LucideIcon }> = [
  { title: "Zone d'intervention personnalisée", Icon: MapPin },
  { title: "Sélection des métiers couverts", Icon: Briefcase },
  { title: "Auto-Accept intelligent activable", Icon: Power },
  { title: "Mise en pause du compte à tout moment", Icon: PauseCircle },
];

export function ProHowItWorks() {
  return (
    <section id="comment" className="relative scroll-mt-24">
      <div className="mx-auto max-w-[1350px] px-6 py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-12">
          <div className="flex flex-col">
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: "#ea580c" }}
            >
              En 3 étapes
            </span>
            <h2 className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 lg:text-[36px]">
              Comment ça marche ?
            </h2>

            <div className="mt-10 flex w-full items-start gap-4">
              {STEPS.map((s, i) => (
                <Fragment key={s.title}>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-full border border-slate-300 bg-white text-[15px] font-semibold text-slate-700">
                        {i + 1}
                      </div>
                      <s.Icon
                        className="h-[26px] w-[26px] text-slate-700"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </div>
                    <h3 className="mt-5 text-[16px] font-bold leading-tight text-slate-900">
                      {s.title}
                    </h3>
                    <p className="mt-2 max-w-[260px] text-[13.5px] leading-relaxed text-slate-500">
                      {s.text}
                    </p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <svg
                      className="h-4 w-12 shrink-0 self-center text-slate-400"
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

          <aside
            className="relative overflow-hidden rounded-lg p-6 text-white lg:p-8"
            style={{ backgroundColor: "#1e3a8a" }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 110% 20%, rgba(255,255,255,0.18), transparent 45%), radial-gradient(circle at 95% 95%, rgba(234,88,12,0.35), transparent 50%)",
              }}
            />
            <div className="relative">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                Vous restez maître à bord
              </div>
              <h3 className="mt-3 text-[22px] font-bold leading-tight tracking-tight lg:text-[24px]">
                Gardez le contrôle
              </h3>
              <ul className="mt-6 space-y-3">
                {CONTROLS.map((c) => (
                  <li
                    key={c.title}
                    className="flex items-center gap-3 text-[14px] text-white/95"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/10">
                      <c.Icon
                        className="h-[16px] w-[16px] text-[#fb923c]"
                        strokeWidth={2}
                        aria-hidden
                      />
                    </span>
                    {c.title}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
