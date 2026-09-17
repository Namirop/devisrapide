import { Reveal } from "@/components/ds/Reveal";
import {
  NOTIFS,
  NotificationPill,
} from "@/components/ds/shared/NotificationPill";

// Section « notifications temps réel » : trois notifications façon écran
// verrouillé, en pastilles de verre dépoli sur un panneau sombre.

export function ProNotifications() {
  return (
    <section className="relative scroll-mt-20 lg:scroll-mt-24">
      <div className="mx-auto max-w-[1400px] px-6 py-12 lg:py-13">
        {/* Visuel à gauche et texte à droite en desktop (via order) ; sur
            mobile, l'ordre du DOM place le texte en premier. */}
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          <Reveal className="lg:order-2">
            <div className="lg:ml-auto lg:max-w-[480px]">
              <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-slate-500 sm:text-[13px]">
                Notifications temps réel
              </span>
              <h2 className="font-display mt-3 text-[28px] font-bold leading-[1.05] tracking-tight text-slate-900 lg:text-[36px]">
                Ne ratez aucune{" "}
                <span style={{ color: "#ea580c" }}>opportunité</span>
              </h2>
              <p className="mt-4 max-w-[460px] text-[15px] leading-relaxed text-slate-600">
                Une demande matchant votre zone et votre métier&nbsp;?
                Notification instantanée sur votre téléphone. Réactivité =
                chantier remporté.
              </p>
              <ul className="mt-6 space-y-2 text-[13.5px] text-slate-600">
                <li>· Alerte push native iOS / Android (PWA installable)</li>
                <li>· Email backup si push indisponible</li>
                <li>· Mode Auto-Accept pour ne jamais rater un lead</li>
              </ul>
            </div>
          </Reveal>

          <Reveal delay={120} className="lg:order-1">
            <div
              className="relative overflow-hidden rounded-[28px] p-3.5 shadow-[0_30px_80px_-30px_rgba(2,6,23,0.65)]"
              style={{
                backgroundImage:
                  "linear-gradient(155deg, #1e3a8a 0%, #15285f 45%, #0b1733 100%)",
              }}
            >
              {/* Halos colorés : donnent de la matière au backdrop-blur des
                  pastilles posées dessus. */}
              <div aria-hidden className="pointer-events-none absolute inset-0">
                <div
                  className="absolute -right-8 -top-10 h-44 w-44 rounded-full blur-3xl"
                  style={{ backgroundColor: "rgba(96,165,250,0.40)" }}
                />
                <div
                  className="absolute -bottom-10 -left-6 h-40 w-40 rounded-full blur-3xl"
                  style={{ backgroundColor: "rgba(234,88,12,0.30)" }}
                />
              </div>

              <div className="relative space-y-2.5">
                {NOTIFS.map((n, i) => (
                  <NotificationPill key={i} n={n} />
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
