#!/usr/bin/env node
/**
 * Génère src/app/favicon.ico à partir du logo source.
 *
 * Source : public/logo/logo.png (1024x1024 RGBA picto)
 * Output : src/app/favicon.ico — conteneur ICO multi-résolution (16/32/48)
 *          avec des PNG embarqués.
 *
 * sharp ne sait pas écrire le format .ico ; on encode donc nous-mêmes le
 * conteneur ICO (header ICONDIR + entries ICONDIRENTRY) autour des buffers
 * PNG produits par sharp. Le PNG embarqué dans un .ico est supporté par tous
 * les navigateurs modernes (Windows Vista+).
 *
 * Usage : node scripts/generate-favicon.mjs
 * Idempotent — re-run à chaque changement de logo.
 */
import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SRC = resolve(ROOT, "public/logo/logo.png");
const OUT = resolve(ROOT, "src/app/favicon.ico");

const SIZES = [16, 32, 48];

// Encode un conteneur ICO autour de PNG déjà rendus.
// pngs : Array<{ size: number, data: Buffer }>
function buildIco(pngs) {
  const count = pngs.length;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // réservé
  header.writeUInt16LE(1, 2); // type = 1 (icône)
  header.writeUInt16LE(count, 4); // nombre d'images

  const entries = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count; // les données PNG commencent après les entries
  pngs.forEach((png, i) => {
    const e = i * 16;
    // 0 dans le champ largeur/hauteur signifie 256 dans la spec ICO.
    entries.writeUInt8(png.size >= 256 ? 0 : png.size, e + 0);
    entries.writeUInt8(png.size >= 256 ? 0 : png.size, e + 1);
    entries.writeUInt8(0, e + 2); // palette (0 = aucune)
    entries.writeUInt8(0, e + 3); // réservé
    entries.writeUInt16LE(1, e + 4); // plans de couleur
    entries.writeUInt16LE(32, e + 6); // bits par pixel (RGBA)
    entries.writeUInt32LE(png.data.length, e + 8); // taille des données
    entries.writeUInt32LE(offset, e + 12); // offset des données
    offset += png.data.length;
  });

  return Buffer.concat([header, entries, ...pngs.map((p) => p.data)]);
}

async function main() {
  const pngs = [];
  for (const size of SIZES) {
    const data = await sharp(SRC)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    pngs.push({ size, data });
  }
  await writeFile(OUT, buildIco(pngs));
  console.log(`  ✔ ${OUT} (${SIZES.join(", ")} px)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
