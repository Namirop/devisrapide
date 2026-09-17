#!/usr/bin/env node
/**
 * Génère les icônes PWA (public/icons/icon-{192,256,384,512}.png et
 * icon-maskable-512.png) depuis public/logo/logo.png.
 *
 * Toutes sont aplaties sur fond blanc opaque : iOS compose les icônes à canal
 * alpha sur du noir, ce qui rend le logo illisible. `resize({ background })`
 * ne peint que le letterbox, d'où `flatten()`, qui supprime réellement le
 * canal alpha (`sharp(file).stats()` renvoie alors `isOpaque: true`).
 *
 * La variante maskable réduit le logo à 80 % du canevas pour qu'Android
 * applique ses masques (cercle, squircle…) sans le rogner.
 *
 * Usage : node scripts/generate-pwa-icons.mjs (idempotent).
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
