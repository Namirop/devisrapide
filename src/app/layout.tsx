import type { Metadata } from "next";
import localFont from "next/font/local";

import { CookiesBanner } from "@/components/cookies/CookiesBanner";
import { ScrollToTop } from "@/components/ds/ScrollToTop";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { SITE_URL } from "@/lib/site-url";

import "./globals.css";

// Polices auto-hebergees (fichiers dans ./fonts) plutot que next/font/google.
// `next/font/google` telecharge les .woff2 depuis fonts.gstatic.com PENDANT
// le build : un 404 ou une coupure cote Google fait echouer le deploiement,
// ce qui est deja arrive. Servis depuis le repo, les builds ne dependent plus
// que de nous. Ce sont les memes fichiers que ceux servis par Google (sous-
// ensemble latin, suffisant pour le francais — l'oe lie est dans la plage).
//
// Fichiers VARIABLES : un seul .woff2 par famille couvre toute la plage de
// graisses, d'ou `weight` en intervalle et non en liste.

const inter = localFont({
  src: "./fonts/inter-latin-var.woff2",
  variable: "--font-inter",
  weight: "400 700",
  display: "swap",
});

// Display font reservee aux gros titres (Hero H1) sur les pages publiques.
// Pas d'usage body. Maintenue pour la landing actuelle.
const jakarta = localFont({
  src: "./fonts/jakarta-latin-var.woff2",
  variable: "--font-display",
  weight: "700 800",
  display: "swap",
});

// Display font specifique au dashboard pro (refonte visuelle 2b redesign).
// Utilisee via la classe utility `.font-display` sur les titres + chiffres
// XXL des stats. Garde Jakarta intact sur la landing. Si validation V2
// polish, Bricolage pourra remplacer Jakarta partout.
const bricolage = localFont({
  src: "./fonts/bricolage-latin-var.woff2",
  variable: "--font-bricolage",
  weight: "400 700",
  display: "swap",
});

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
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "DevisRapide",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport = {
  themeColor: "#0f1e3d",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${jakarta.variable} ${bricolage.variable} h-full`}
    >
      <head>
        {/* Preconnect aux services externes critiques pour reduire le
            DNS/TLS handshake au moment du first interactive call. */}
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <link rel="preconnect" href="https://js.stripe.com" />
      </head>
      <body className="min-h-full flex flex-col">
        <ScrollToTop />
        {children}
        <CookiesBanner />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
