#!/usr/bin/env node
/**
 * Génère les icônes PWA à partir du logo source.
 *
 * Source : public/logo/logo.png (1024x1024 RGBA)
 * Output : public/icons/icon-{192,256,384,512}.png + icon-maskable-512.png
 *
 * L'icône maskable applique un safe-zone padding de 20% (logo redimensionné
 * a 80% du canvas, centré, fond navy DS #0f1e3d) pour qu'Android puisse
 * appliquer ses formes (circle, squircle, etc.) sans rogner le logo.
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
const MASKABLE_BG = { r: 15, g: 30, b: 61, alpha: 1 }; // #0f1e3d navy DS
const MASKABLE_SAFE_RATIO = 0.8;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const size of SIZES) {
    const dest = resolve(OUT_DIR, `icon-${size}.png`);
    await sharp(SRC)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
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
      background: MASKABLE_BG,
    },
  })
    .composite([{ input: innerLogo, top: offset, left: offset }])
    .png()
    .toFile(maskableDest);
  console.log(`  ✔ ${maskableDest} (maskable, safe-zone ${MASKABLE_SAFE_RATIO * 100}%)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
