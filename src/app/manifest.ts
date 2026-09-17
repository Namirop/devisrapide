import type { MetadataRoute } from "next";

/**
 * Manifest PWA (/manifest.webmanifest), destiné aux pros : l'app installée
 * s'ouvre sur le dashboard. Icônes produites par
 * scripts/generate-pwa-icons.mjs ; la maskable garde le logo dans une zone
 * sûre de 80 % pour les masques Android.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DevisRapide — Espace Artisan",
    short_name: "DevisRapide",
    description: "Recevez et gérez vos leads artisan en Belgique",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f1e3d",
    theme_color: "#0f1e3d",
    lang: "fr-BE",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-256.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
