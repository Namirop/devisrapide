import type { Metadata } from "next";

import { ContactHero } from "@/components/contact/ContactHero";
import { CompanyInfoCard } from "@/components/contact/CompanyInfoCard";
import { TrustReasons } from "@/components/contact/TrustReasons";
import { MissionSection } from "@/components/contact/MissionSection";

export const metadata: Metadata = {
  title: "Contact & Informations légales — DevisRapide",
  description:
    "Coordonnées et informations légales de DevisRapide : siège social, numéro d'entreprise, TVA, contact.",
};

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <CompanyInfoCard />
      <TrustReasons />
      <MissionSection />
    </>
  );
}
