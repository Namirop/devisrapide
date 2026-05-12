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
          <span
            className="font-extrabold leading-none tracking-tight"
            style={{
              color: "#1e3a8a",
              fontSize: "clamp(120px, 20vw, 200px)",
              letterSpacing: "-0.05em",
            }}
            aria-hidden
          >
            <span>4</span>
            <span className="relative inline-block">
              0
              <span
                className="absolute -bottom-1 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full"
                style={{ backgroundColor: "#ea580c" }}
                aria-hidden
              />
            </span>
            <span>4</span>
          </span>

          <h1 className="mt-8 text-[32px] font-bold tracking-tight text-slate-900 lg:text-[40px]">
            Page introuvable
          </h1>
          <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-slate-600">
            La page que vous cherchez n&apos;existe plus ou a été déplacée.
            Vérifiez le lien ou revenez à l&apos;accueil.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "accent" }),
                "h-12 px-6 text-[15px] font-semibold",
              )}
            >
              Retour à l&apos;accueil
            </Link>
            <Link
              href="/demande"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-12 px-6 text-[15px]",
              )}
            >
              Faire une demande
            </Link>
          </div>

          <a
            href="mailto:contact@devisrapide.be"
            className="mt-10 text-[13px] text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
          >
            Signaler un problème
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
