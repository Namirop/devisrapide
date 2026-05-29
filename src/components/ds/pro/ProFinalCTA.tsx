import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

import { Reveal } from "@/components/ds/Reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProFinalCTA() {
  return (
    <section className="relative" style={{ backgroundColor: "#1e3a8a" }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 100% 0%, rgba(255,255,255,0.18), transparent 50%), radial-gradient(circle at 0% 100%, rgba(234,88,12,0.45), transparent 55%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-[1350px] flex-col items-center px-6 py-16 text-center text-white lg:py-24">
        <Reveal className="flex w-full flex-col items-center">
        <span
          className="text-[12px] font-semibold uppercase tracking-[0.05em] sm:text-[13px]"
          style={{ color: "#fb923c" }}
        >
          Rejoignez le réseau
        </span>
        <h2 className="font-display mt-3 max-w-[700px] text-[32px] font-bold leading-[1.1] tracking-tight lg:text-[44px]">
          Prêt à développer votre activité&nbsp;?
        </h2>
        <p className="mt-4 max-w-[560px] text-[15.5px] leading-relaxed text-white/80">
          Inscription en 2 minutes, validation sous 24h. Aucun engagement,
          aucun frais fixe. Vous restez maître de vos chantiers.
        </p>
        <Link
          href="/inscription-pro"
          className={cn(
            buttonVariants({ variant: "accent" }),
            "mt-8 h-12 gap-2 px-6 text-[15px] font-semibold",
          )}
        >
          S&apos;inscrire gratuitement
          <ArrowRight size={16} weight="bold" aria-hidden />
        </Link>
        <p className="mt-4 text-[12px] text-white/60">
          Gratuit à l&apos;inscription · Sans engagement · 100% Belge
        </p>
        </Reveal>
      </div>
    </section>
  );
}
