import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Handshake,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";

import { Reveal } from "./Reveal";
import { Button } from "@/components/ui/button";

// Bandeau primes Wallonie — fond jaune ecusson + vrai drapeau wallon + copy
// + CTA + 3 bullets. CTA en lien externe vers energie.wallonie.be (decision
// Romain).

const BULLETS = [
  { Icon: Wallet, t: "Économisez jusqu'à plusieurs milliers d'euros" },
  { Icon: Handshake, t: "Accompagnement gratuit dans vos démarches" },
  { Icon: FileText, t: "Professionnels informés des aides disponibles" },
] as const;

export function WalloniaBanner() {
  return (
    <section id="primes" className="relative scroll-mt-20 lg:scroll-mt-16">
      <div className="mx-auto max-w-[1350px] px-6 py-10 lg:py-13">
        <Reveal>
          <div
            className="overflow-hidden rounded-lg border"
            style={{ backgroundColor: "#fef9c3", borderColor: "#fde68a" }}
          >
            <div className="grid items-center gap-6 p-6 lg:grid-cols-[auto_1.4fr_1fr] lg:gap-8 lg:p-7">
              <div className="shrink-0">
                <Image
                  src="/wallonia-flag.png"
                  alt="Drapeau de la Wallonie"
                  width={132}
                  height={88}
                  className="h-[88px] w-[132px] rounded-md object-cover shadow-sm ring-1 ring-yellow-300"
                />
              </div>

              <div>
                <h3 className="font-display text-[20px] font-bold tracking-tight text-slate-900 lg:text-[22px]">
                  Profitez des primes de la Région Wallonne
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-700">
                  Isolation, toiture, chauffage, panneaux solaires… Nos
                  partenaires vous aident à identifier les primes auxquelles
                  vous pouvez prétendre.
                </p>
                <Link href="/demande" className="inline-flex">
                  <Button variant="accent" className="mt-4 h-10 px-4 text-sm">
                    Faire ma demande
                    <ArrowRight size={16} weight="bold" aria-hidden />
                  </Button>
                </Link>
              </div>

              <ul className="space-y-3">
                {BULLETS.map((b) => (
                  <li
                    key={b.t}
                    className="flex items-start gap-3 text-[13px] text-slate-800"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-yellow-200 bg-white text-slate-700">
                      <b.Icon size={15} weight="regular" aria-hidden />
                    </span>
                    <span className="pt-1 leading-snug">{b.t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
