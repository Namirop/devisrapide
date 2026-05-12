import { Hero } from "@/components/ds/Hero";
import { Stats } from "@/components/ds/Stats";
import { HowItWorks } from "@/components/ds/HowItWorks";
import { WalloniaBanner } from "@/components/ds/WalloniaBanner";
import { Categories } from "@/components/ds/Categories";
import { B2BSection } from "@/components/ds/B2BSection";
import { Testimonials } from "@/components/ds/Testimonials";

// Grille pattern globale : une seule couche absolute pour toute la landing,
// pour que la grille soit continue d'une section a l'autre (pas de "reset
// d'offset" entre sections qui creait des carres coupes aux limites).
// Les sections grises (Wallonia, B2B) ont bg-slate-50 qui couvre la grille.

export default function HomePage() {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern"
        aria-hidden
      />
      <Hero />
      <Stats />
      <HowItWorks />
      <WalloniaBanner />
      <Categories />
      <B2BSection />
      <Testimonials />
    </div>
  );
}
