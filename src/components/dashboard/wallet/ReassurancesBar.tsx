import { Lightning, Lock } from "@phosphor-icons/react/dist/ssr";

// Bande de reassurances sous la grille de packs. 3 colonnes alignees
// avec les 3 packs sur desktop, stack vertical sur mobile. Item central
// utilise le wordmark Stripe officiel (SVG inline, pas de dependance)
// pour matcher la maquette — les deux autres restent en Phosphor.

function StripeWordmark({ className }: { className?: string }) {
  // Wordmark Stripe officiel — viewBox calibre sur la version brand 60x25.
  return (
    <svg
      viewBox="0 0 60 25"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.63l.21 1.03c.56-.52 1.59-1.27 3.22-1.27 2.92 0 5.67 2.63 5.67 7.45 0 5.26-2.72 7.52-5.69 7.52zM40 9.04c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.87zm-4.32 9.35v9.79H19.8V5.57h3.7l.27 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.47 1.06zm-8.81 4.55c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.4h-3.14l.01 5.37zm-4.93.62c0 2.86-2.27 4.49-5.58 4.49a11.05 11.05 0 0 1-4.35-.9v-3.92c1.29.7 2.93 1.22 4.36 1.22.97 0 1.66-.26 1.66-1.06 0-2.07-6.18-1.29-6.18-5.79 0-2.81 2.14-4.5 5.38-4.5 1.37 0 2.74.21 4.1.75v3.87a9.32 9.32 0 0 0-4.1-1.06c-.91 0-1.48.26-1.48.93 0 1.95 6.19 1.02 6.19 5.97z" />
    </svg>
  );
}

type IconItem = {
  kind: "icon";
  Icon: typeof Lock;
  iconClass: string;
  ringClass: string;
  title: string;
  subtitle: string;
};

type StripeItem = {
  kind: "stripe";
  title: string;
  subtitle: string;
};

type Item = IconItem | StripeItem;

const ITEMS: ReadonlyArray<Item> = [
  {
    kind: "icon",
    Icon: Lock,
    iconClass: "text-[#1e3a8a]",
    ringClass: "bg-blue-50",
    title: "Paiement 100% sécurisé",
    subtitle: "Vos données sont protégées.",
  },
  {
    kind: "stripe",
    title: "Paiement sécurisé via Stripe",
    subtitle: "CB, Visa, Mastercard, Apple Pay.",
  },
  {
    kind: "icon",
    Icon: Lightning,
    iconClass: "text-slate-700",
    ringClass: "bg-slate-100",
    title: "Recharge instantanée",
    subtitle: "Crédit disponible immédiatement.",
  },
];

export function ReassurancesBar() {
  return (
    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-6">
      {ITEMS.map((item) => (
        // justify-center : chaque item est centre horizontalement dans
        // sa colonne grid, donc visuellement aligne avec le centre du
        // pack au-dessus.
        <div
          key={item.title}
          className="flex items-center justify-center gap-4"
        >
          {item.kind === "icon" ? (
            <span
              className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${item.ringClass}`}
              aria-hidden
            >
              <item.Icon
                size={26}
                weight="fill"
                className={item.iconClass}
              />
            </span>
          ) : (
            <span
              className="inline-flex h-14 w-[72px] shrink-0 items-center justify-center"
              aria-hidden
            >
              <StripeWordmark className="h-7 w-auto text-[#635BFF]" />
            </span>
          )}
          <div className="leading-tight">
            <p className="text-[15.5px] font-semibold text-slate-900">
              {item.title}
            </p>
            <p className="mt-1 text-[13.5px] text-slate-500">
              {item.subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
