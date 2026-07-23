import { Handshake, HardHat, LockKey, ShieldCheck } from "@phosphor-icons/react/dist/ssr";

// "Pourquoi faire confiance a DevisRapide ?" — reprend la grille 4 cartes de
// la maquette au plus pres (contenu centre, icone en gros cercle, trait
// orange en pied de carte aligne via mt-auto). C'est un pattern "carte
// generique IA" au sens du skill anti-ai-design-patterns, mais Romain l'a
// valide explicitement pour cette section precise : la maquette est claire
// et pas moche, pas la peine de la retravailler pour eviter le pattern.
type Reason = {
  icon: React.ComponentType<{ size?: number; weight?: "regular" | "bold" | "fill"; className?: string }>;
  title: string;
  desc: string;
};

const REASONS: readonly Reason[] = [
  {
    icon: ShieldCheck,
    title: "Entreprise belge",
    desc: "Structure officiellement enregistrée en Belgique et soumise au droit économique belge.",
  },
  {
    icon: LockKey,
    title: "Paiements sécurisés",
    desc: "Vos recharges Wallet sont protégées grâce à des paiements sécurisés via nos partenaires de paiement.",
  },
  {
    icon: Handshake,
    title: "Transparence",
    desc: "Aucun abonnement obligatoire, aucun frais caché et un contrôle total de votre budget.",
  },
  {
    icon: HardHat,
    title: "Plateforme dédiée aux professionnels",
    desc: "Recevez des opportunités commerciales qualifiées pour développer votre activité.",
  },
];

export function TrustReasons() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-16 pt-16 lg:pb-20 lg:pt-20">
      <h2 className="font-display text-center text-[24px] font-bold tracking-tight text-slate-900 sm:text-[28px]">
        Pourquoi faire confiance à DevisRapide&nbsp;?
      </h2>

      <div className="mt-9 flex flex-wrap justify-center gap-5">
        {REASONS.map((r) => (
          <div
            key={r.title}
            className="flex h-full w-[280px] flex-col items-center rounded-lg border border-slate-200 border-b-2 bg-white p-5 text-center sm:w-[230px]"
            style={{ borderBottomColor: "#ea580c" }}
          >
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-slate-100">
              <r.icon size={36} weight="bold" className="text-[#1e3a8a]" />
            </span>
            <h3 className="mt-5 max-w-[160px] text-[16px] font-semibold text-slate-900">
              {r.title}
            </h3>
            <p className="mt-3 max-w-[180px] text-[14.5px] leading-relaxed text-slate-600">
              {r.desc}
            </p>
            <div className="mt-auto pt-5">
              <div
                className="h-[2px] w-6"
                style={{ backgroundColor: "#ea580c" }}
                aria-hidden
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
