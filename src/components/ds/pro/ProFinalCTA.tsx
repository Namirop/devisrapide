import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

import { Reveal } from "@/components/ds/Reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProFinalCTA() {
  return (
    <section style={{ backgroundColor: "#1e3a8a" }}>
      {/* Contenu legerement agrandi (~10%) ; padding reduit (py-20/24 ->
          py-16/20) pour que la hauteur de section ne change pas. */}
      <div className="mx-auto flex max-w-[1400px] flex-col items-center px-6 py-16 text-center text-white lg:py-20">
        <Reveal className="flex w-full flex-col items-center">
        <h2 className="font-display max-w-[820px] text-[40px] font-bold leading-[1.05] tracking-tight sm:text-[46px] lg:text-[62px]">
          Prêt à développer votre{" "}
          <span style={{ color: "#ea580c" }}>activité</span>&nbsp;?
        </h2>
        <p className="mt-5 max-w-[600px] text-[17px] leading-relaxed text-white/80">
          Inscription en 2 minutes, validation sous 24h. Aucun engagement,
          aucun frais fixe. Vous restez maître de vos chantiers.
        </p>
        <Link
          href="/inscription-pro"
          className={cn(
            buttonVariants({ variant: "accent" }),
            "mt-9 h-[52px] gap-2 px-7 text-[16px] font-semibold",
          )}
        >
          S&apos;inscrire gratuitement
          <ArrowRight size={18} weight="bold" aria-hidden />
        </Link>
        </Reveal>
      </div>
    </section>
  );
}
