import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

import { Reveal } from "@/components/ds/Reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProFinalCTA() {
  return (
    <section style={{ backgroundColor: "#1e3a8a" }}>
      <div className="mx-auto flex max-w-[1350px] flex-col items-center px-6 py-16 text-center text-white lg:py-20">
        <Reveal className="flex w-full flex-col items-center">
        <h2 className="font-display max-w-[760px] text-[36px] font-bold leading-[1.05] tracking-tight sm:text-[42px] lg:text-[56px]">
          Prêt à développer votre{" "}
          <span style={{ color: "#ea580c" }}>activité</span>&nbsp;?
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
        </Reveal>
      </div>
    </section>
  );
}
