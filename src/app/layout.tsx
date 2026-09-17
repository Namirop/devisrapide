import type { Metadata } from "next";
import localFont from "next/font/local";

import { CookiesBanner } from "@/components/cookies/CookiesBanner";
import { ScrollToTop } from "@/components/ds/ScrollToTop";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { SITE_URL } from "@/lib/site-url";

import "./globals.css";

// Polices auto-hébergées plutôt que next/font/google, qui télécharge les
// fichiers pendant le build : une indisponibilité côté Google ferait échouer
// le déploiement. Sous-ensemble latin (suffisant pour le français) ; fichiers
// variables, d'où `weight` en intervalle.

const inter = localFont({
  src: "./fonts/inter-latin-var.woff2",
  variable: "--font-inter",
  weight: "400 700",
  display: "swap",
});

// Police display des titres hero des pages publiques.
const jakarta = localFont({
  src: "./fonts/jakarta-latin-var.woff2",
  variable: "--font-display",
  weight: "700 800",
  display: "swap",
});

// Police display de l'application (classe `.font-display` : titres, chiffres).
const bricolage = localFont({
  src: "./fonts/bricolage-latin-var.woff2",
  variable: "--font-bricolage",
  weight: "400 700",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Une page enfant ne fournit que son titre court, suffixé par le template.
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
        {/* Préconnexion aux domaines tiers : économise DNS et TLS au
            premier appel. */}
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
