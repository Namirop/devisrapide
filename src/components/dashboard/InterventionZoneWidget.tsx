import Link from "next/link";
import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  currentRadiusKm: number;
};

/**
 * Widget "Portee de reception des leads" : montre les 3 paliers V1
 * (30km / 60km / Toute la BE) avec celui actif highlight.
 *
 * Convention : currentRadiusKm = -1 signifie OPEN ("Toute la Belgique").
 */
const PALIERS = [
  { value: 30, label: "30 km", sub: "autour de votre entreprise" },
  { value: 60, label: "60 km", sub: "autour de votre entreprise" },
  { value: -1, label: "Partout en Belgique", sub: "Toute la zone V1" },
] as const;

export function InterventionZoneWidget({ currentRadiusKm }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <MapPin
          className="h-4 w-4 text-[#1e3a8a]"
          strokeWidth={2}
          aria-hidden
        />
        <h3 className="text-[14.5px] font-bold text-slate-900">
          Portée de réception
        </h3>
      </div>
      <div className="flex flex-col gap-2">
        {PALIERS.map((p) => {
          const active = p.value === currentRadiusKm;
          return (
            <div
              key={p.value}
              className={cn(
                "rounded-md border px-3 py-2 transition-colors",
                active
                  ? "border-[#1e3a8a] bg-blue-50"
                  : "border-slate-200 bg-white",
              )}
            >
              <div
                className={cn(
                  "text-[13.5px] font-semibold",
                  active ? "text-[#1e3a8a]" : "text-slate-700",
                )}
              >
                {p.label}
              </div>
              <div className="text-[11.5px] text-slate-500">{p.sub}</div>
            </div>
          );
        })}
      </div>
      <Link
        href="/dashboard/profil"
        className="mt-3 inline-block text-[12.5px] font-medium text-[#1e3a8a] hover:underline"
      >
        Modifier ma zone →
      </Link>
    </div>
  );
}
