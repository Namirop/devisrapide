import { Hero } from "@/components/ds/Hero";
import { Stats } from "@/components/ds/Stats";
import { HowItWorks } from "@/components/ds/HowItWorks";
import { WalloniaBanner } from "@/components/ds/WalloniaBanner";
import { Categories } from "@/components/ds/Categories";
import { B2BSection } from "@/components/ds/B2BSection";
import { Testimonials } from "@/components/ds/Testimonials";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <HowItWorks />
      <WalloniaBanner />
      <Categories />
      <B2BSection />
      <Testimonials />
    </>
  );
}
