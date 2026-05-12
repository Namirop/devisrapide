"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Boundary erreur globale Next.js. Doit etre Client Component.
// On NE wrappe PAS dans <Header><Footer> ici : ce fichier remplace le main
// layout en cas d'erreur racine. On garde une UI sobre autonome.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log cote client. Sentry ou autre observability sera ajoute Sprint 5+.
    console.error("Application error", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-10 sm:px-6 lg:py-12">
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center gap-4">
          <span
            className="font-extrabold leading-none tracking-tight"
            style={{
              color: "#1e3a8a",
              fontSize: "clamp(140px, 22vw, 240px)",
              letterSpacing: "-0.05em",
            }}
            aria-hidden
          >
            500
          </span>
          <AlertTriangle
            className="hidden h-20 w-20 shrink-0 sm:block lg:h-24 lg:w-24"
            strokeWidth={1.75}
            style={{ color: "#ea580c" }}
            aria-hidden
          />
        </div>

        <h1 className="mt-8 text-[40px] font-bold tracking-tight text-slate-900 lg:text-[54px]">
          Une erreur est survenue
        </h1>
        <p className="mt-5 max-w-xl text-[18px] leading-relaxed text-slate-600">
          Réessayez dans un instant. Si le problème persiste, contactez-nous à{" "}
          <a
            href="mailto:contact@devisrapide.be"
            className="font-medium text-[#1e3a8a] underline-offset-2 hover:underline"
          >
            contact@devisrapide.be
          </a>
          .
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            variant="accent"
            onClick={() => reset()}
            className="h-[52px] gap-2 px-7 text-[15.5px] font-semibold"
          >
            <RotateCw className="h-5 w-5" strokeWidth={2} aria-hidden />
            Réessayer
          </Button>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-[52px] px-7 text-[15.5px]",
            )}
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
