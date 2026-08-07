#!/usr/bin/env node
/**
 * Génère les icônes PWA à partir du logo source.
 *
 * Source : public/logo/logo.png (1024x1024 RGBA)
 * Output : public/icons/icon-{192,256,384,512}.png + icon-maskable-512.png
 *
 * TOUTES les icônes sont aplaties sur un fond BLANC OPAQUE (`flatten`), y
 * compris la maskable. C'est une contrainte, pas une préférence :
 *   - iOS ne gère pas la transparence sur les icônes d'écran d'accueil et
 *     compose un PNG à canal alpha sur du NOIR. Avec le logo source (maison
 *     navy + flèches orange) sur fond transparent, la maison disparaissait
 *     et l'icône virait au noir — bug remonté sur l'iPhone du client.
 *   - `resize({ background })` ne suffit pas : il ne peint que le
 *     letterbox autour de l'image, pas les pixels transparents DEDANS.
 *     D'où le `flatten()`, qui supprime réellement le canal alpha.
 * Vérification : `sharp(file).stats()` doit renvoyer `isOpaque: true`.
 *
 * L'icône maskable applique en plus un safe-zone padding de 20% (logo
 * redimensionné à 80% du canvas, centré) pour qu'Android puisse appliquer
 * ses formes (circle, squircle, etc.) sans rogner le logo. Son fond était
 * navy DS #0f1e3d, sur lequel la maison navy du logo était invisible.
 *
 * Usage : node scripts/generate-pwa-icons.mjs
 *
 * Idempotent — peut être re-run à chaque changement de logo.
 */
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SRC = resolve(ROOT, "public/logo/logo.png");
const OUT_DIR = resolve(ROOT, "public/icons");

const SIZES = [192, 256, 384, 512];
const BG = { r: 255, g: 255, b: 255, alpha: 1 }; // blanc opaque, cf. en-tête
const MASKABLE_SAFE_RATIO = 0.8;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const size of SIZES) {
    const dest = resolve(OUT_DIR, `icon-${size}.png`);
    await sharp(SRC)
      .resize(size, size, { fit: "contain", background: BG })
      .flatten({ background: BG })
      .png()
      .toFile(dest);
    console.log(`  ✔ ${dest}`);
  }

  const maskableSize = 512;
  const inner = Math.round(maskableSize * MASKABLE_SAFE_RATIO);
  const offset = Math.round((maskableSize - inner) / 2);
  const innerLogo = await sharp(SRC)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const maskableDest = resolve(OUT_DIR, "icon-maskable-512.png");
  await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: innerLogo, top: offset, left: offset }])
    .flatten({ background: BG })
    .png()
    .toFile(maskableDest);
  console.log(`  ✔ ${maskableDest} (maskable, safe-zone ${MASKABLE_SAFE_RATIO * 100}%)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
