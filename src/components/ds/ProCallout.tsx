import Link from "next/link";
import { ArrowRight, Check, Shield } from "@phosphor-icons/react/dist/ssr";

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
      <div className="absolute bottom-2 right-2 grid h-32 w-32 place-items-center rounded-full bg-white/5 text-white/15">
        <Shield size={96} weight="thin" aria-hidden />
      </div>

      <div className="relative flex h-full flex-col p-5 lg:p-6">
        <h3 className="font-display text-[18px] font-bold tracking-tight lg:text-[20px]">
          Vous êtes un professionnel&nbsp;?
        </h3>
        <p className="mt-1.5 max-w-[300px] text-[12.5px] leading-relaxed text-white/75">
          Rejoignez notre réseau d&apos;artisans qualifiés et recevez des
          demandes de clients près de chez vous.
        </p>

        <ul className="mt-4 space-y-2">
          {[
            "Demandes qualifiées",
            "Paiement à la performance",
            "Inscription gratuite",
          ].map((t) => (
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

        <div className="mt-5">
          <span className="inline-flex h-10 items-center gap-2 rounded-md border border-white/40 px-3.5 text-[13px] font-medium transition-colors group-hover:bg-white/10">
            Je m&apos;inscris gratuitement
            <ArrowRight size={15} weight="bold" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}
