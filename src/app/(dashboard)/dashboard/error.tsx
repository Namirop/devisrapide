"use client";

import { AlertOctagon, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Sentry sera branche au Sprint 5 (cf. v2-roadmap.md). En attendant,
  // on log au moins en console pour permettre le debug dev.
  if (typeof window !== "undefined") {
    console.error("[dashboard/error]", error);
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-16 text-center">
      <span
        className="grid h-16 w-16 place-items-center rounded-full bg-rose-50"
        aria-hidden
      >
        <AlertOctagon className="h-8 w-8 text-rose-500" strokeWidth={1.75} />
      </span>
      <h1 className="mt-6 text-[24px] font-bold tracking-tight text-slate-900">
        Une erreur est survenue
      </h1>
      <p className="mt-2 max-w-md text-[14px] text-slate-600">
        Nous n&apos;avons pas pu charger cette page. Réessayez dans un
        instant ; si le problème persiste, contactez le support.
      </p>
      {error.digest && (
        <p className="mt-3 text-[11px] uppercase tracking-wider text-slate-400">
          Référence : {error.digest}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <Button type="button" variant="accent" onClick={reset} className="h-10">
          <RotateCw className="h-4 w-4" strokeWidth={2} aria-hidden />
          Réessayer
        </Button>
      </div>
    </main>
  );
}
