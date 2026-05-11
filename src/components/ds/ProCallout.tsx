import Link from "next/link";
import { ArrowRight, Check, Shield } from "lucide-react";

// Carte CTA navy droite de HowItWorks — extraite en composant autonome.
// Background avec radial gradients pour donner du relief, gros icone shield
// décoratif en bas-droite (opacity 15%), liste 3 avantages, bouton outline-white.

export function ProCallout() {
  return (
    <Link
      href="/pros"
      className="group relative block h-full overflow-hidden rounded-lg text-white shadow-sm"
      style={{ backgroundColor: "#1e3a8a" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 110% 20%, rgba(255,255,255,0.18), transparent 45%), radial-gradient(circle at 95% 95%, rgba(234,88,12,0.35), transparent 50%)",
        }}
      />
      <div className="absolute bottom-2 right-2 grid h-40 w-40 place-items-center rounded-full bg-white/5 text-white/15">
        <Shield className="h-[120px] w-[120px]" strokeWidth={1.25} aria-hidden />
      </div>

      <div className="relative flex h-full flex-col p-7 lg:p-8">
        <h3 className="text-[20px] font-bold tracking-tight lg:text-[22px]">
          Vous êtes un professionnel&nbsp;?
        </h3>
        <p className="mt-2 max-w-[320px] text-[13px] leading-relaxed text-white/75">
          Rejoignez notre réseau d&apos;artisans qualifiés et recevez des
          demandes de clients près de chez vous.
        </p>

        <ul className="mt-5 space-y-2.5">
          {[
            "Demandes qualifiées",
            "Paiement à la performance",
            "Inscription gratuite",
          ].map((t) => (
            <li
              key={t}
              className="flex items-center gap-2 text-[13px] text-white/90"
            >
              <Check
                className="h-4 w-4 text-[#fb923c]"
                strokeWidth={2.5}
                aria-hidden
              />
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-7">
          <span className="inline-flex h-11 items-center gap-2 rounded-md border border-white/40 px-4 text-[14px] font-medium transition-colors group-hover:bg-white/10">
            Je m&apos;inscris gratuitement
            <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}
