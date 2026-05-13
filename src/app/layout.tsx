import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Display font reservee aux gros titres (Hero H1) sur les pages publiques.
// Pas d'usage body. Maintenue pour la landing actuelle (validee par Kamel).
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

// Display font specifique au dashboard pro (refonte visuelle 2b redesign).
// Utilisee via la classe utility `.font-display` sur les titres + chiffres
// XXL des stats. Garde Jakarta intact sur la landing. Si validation V2
// polish, Bricolage pourra remplacer Jakarta partout.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DevisRapide — Trouvez le bon artisan en Belgique",
  description:
    "Plateforme belge de mise en relation avec des artisans qualifiés. Recevez plusieurs devis gratuits en quelques heures.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${jakarta.variable} ${bricolage.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
