import type { MetadataRoute } from "next";

/**
 * Manifest PWA — sert /manifest.webmanifest via le route handler natif Next 16.
 *
 * Cible : les pros (espace authentifie). start_url = /dashboard pour qu'un
 * pro qui installe l'app atterrisse direct sur son dashboard sans repasser
 * par la landing publique.
 *
 * Icones generees via scripts/generate-pwa-icons.mjs (sharp) depuis le logo
 * source. L'icone maskable a un safe-zone 80% pour qu'Android puisse
 * appliquer ses formes (circle, squircle, etc.) sans rogner le logo.
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
