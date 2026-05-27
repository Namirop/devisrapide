import { Hero } from "@/components/ds/Hero";
import { Stats } from "@/components/ds/Stats";
import { HowItWorks } from "@/components/ds/HowItWorks";
import { WalloniaBanner } from "@/components/ds/WalloniaBanner";
import { Categories } from "@/components/ds/Categories";
import { B2BSection } from "@/components/ds/B2BSection";
import { Testimonials } from "@/components/ds/Testimonials";
import { FAQ } from "@/components/ds/FAQ";

// Refonte DS coherente avec le dashboard : la grille technique
// (bg-grid-pattern) est limitee au Hero (zone d'impact, signature visuelle),
// les autres sections vivent sur un fond uni slate-50 commun. Plus
// d'alternance gris/blanc section-par-section qui creait du stop-and-go.

export default function HomePage() {
  return (
    <div className="bg-slate-50">
      <Hero />
      <Stats />
      <HowItWorks />
      <WalloniaBanner />
      <Categories />
      <B2BSection />
      <Testimonials />
      <FAQ />
    </div>
  );
}
