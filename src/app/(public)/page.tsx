import { Hero } from "@/components/ds/Hero";
import { Stats } from "@/components/ds/Stats";
import { HowItWorks } from "@/components/ds/HowItWorks";
import { WalloniaBanner } from "@/components/ds/WalloniaBanner";
import { Categories } from "@/components/ds/Categories";
import { B2BSection } from "@/components/ds/B2BSection";
import { Engagement } from "@/components/ds/Engagement";
import { FAQ } from "@/components/ds/FAQ";

// Grille décorative (bg-grid-pattern) réservée au Hero ; les autres sections
// partagent un fond uni pour une lecture continue.

export default function HomePage() {
  return (
    <div className="bg-slate-50">
      <Hero />
      <Stats />
      <HowItWorks />
      <WalloniaBanner />
      <Categories />
      <B2BSection />
      <Engagement />
      <FAQ />
    </div>
  );
}
