import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, Plus_Jakarta_Sans } from "next/font/google";

import { CookiesBanner } from "@/components/cookies/CookiesBanner";

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

// metadataBase utilise pour resoudre les URLs relatives dans openGraph
// et twitter card (images notamment). En prod = devisrapide.be, en dev
// = localhost. Fallback NEXTAUTH_URL puis localhost.
const SITE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // title.template permet aux pages enfants de set juste leur titre court
  // (qui sera prefixe par "DevisRapide — ..."). title.default sert quand
  // une page n'override pas title (ex: la home).
  title: {
    default: "DevisRapide — Trouvez le bon artisan en Belgique",
    template: "%s — DevisRapide",
  },
  description:
    "Plateforme belge de mise en relation avec des artisans qualifiés. Recevez plusieurs devis gratuits en quelques heures.",
  applicationName: "DevisRapide",
  authors: [{ name: "DevisRapide" }],
  keywords: [
    "artisan",
    "devis",
    "belgique",
    "wallonie",
    "bruxelles",
    "rénovation",
    "toiture",
    "plomberie",
    "électricité",
    "chauffage",
  ],
  openGraph: {
    type: "website",
    locale: "fr_BE",
    url: SITE_URL,
    siteName: "DevisRapide",
    title: "DevisRapide — Trouvez le bon artisan en Belgique",
    description:
      "Plateforme belge de mise en relation avec des artisans qualifiés. Recevez plusieurs devis gratuits en quelques heures.",
    images: [
      {
        url: "/images/hero-artisan-800.webp",
        width: 800,
        height: 600,
        alt: "DevisRapide — artisans qualifiés en Belgique",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DevisRapide — Trouvez le bon artisan en Belgique",
    description:
      "Plateforme belge de mise en relation avec des artisans qualifiés.",
    images: ["/images/hero-artisan-800.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${jakarta.variable} ${bricolage.variable} h-full`}
    >
      <head>
        {/* Preconnect aux services externes critiques pour reduire le
            DNS/TLS handshake au moment du first interactive call. */}
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://browser.sentry-cdn.com" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <CookiesBanner />
      </body>
    </html>
  );
}
