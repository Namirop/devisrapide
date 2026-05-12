import type { Metadata } from "next";
import Link from "next/link";

import { Header } from "@/components/ds/Header";
import { Footer } from "@/components/ds/Footer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Page introuvable — DevisRapide",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <div
            className="font-extrabold leading-none tracking-tight"
            style={{
              color: "#1e3a8a",
              fontSize: "clamp(140px, 22vw, 240px)",
              letterSpacing: "-0.05em",
            }}
            aria-label="404"
          >
            <span aria-hidden>4</span>
            <span
              className="mx-[0.02em] inline-block rounded-full align-middle"
              style={{
                width: "0.58em",
                height: "0.58em",
                backgroundColor: "#ea580c",
              }}
              aria-hidden
            />
            <span aria-hidden>4</span>
          </div>

          <h1 className="mt-10 text-[36px] font-bold tracking-tight text-slate-900 lg:text-[48px]">
            Cette page a changé de chantier.
          </h1>
          <p className="mt-5 max-w-lg text-[17.5px] leading-relaxed text-slate-600">
            Le lien que vous avez suivi n&apos;est plus disponible.
          </p>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "accent" }),
                "h-[52px] px-7 text-[15.5px] font-semibold",
              )}
            >
              Retour à l&apos;accueil
            </Link>
            <Link
              href="/demande"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-[52px] px-7 text-[15.5px]",
              )}
            >
              Faire une demande
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
