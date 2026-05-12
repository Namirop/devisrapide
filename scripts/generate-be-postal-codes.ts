/**
 * Generate src/data/be-postal-codes.json depuis GeoNames BE.
 *
 * Source : https://download.geonames.org/export/zip/BE.zip
 * Format BE.txt (tab-separated, pas de header) :
 *   country_code | postal_code | place_name | admin_name1 | admin_code1 |
 *   admin_name2 | admin_code2 | admin_name3 | admin_code3 | latitude |
 *   longitude | accuracy
 *
 * IMPORTANT — Couverture geographique :
 *   On garde TOUT BE dans le JSON (pas de filtre Wallonie/Bruxelles).
 *   Le filtrage geo (zone V1 = Wallonie + Bruxelles francophone) se fait
 *   cote matching via le rayon pro, pas cote data. Garde la flexibilite
 *   pour pros qui couvrent Bruxelles depuis Anvers, etc., et facilite
 *   l'extension Flandre en V2.
 *
 * Dedup : un code postal peut couvrir plusieurs communes. On garde la
 *   PREMIERE rencontree (typiquement la commune principale).
 *
 * Usage : pnpm tsx scripts/generate-be-postal-codes.ts
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import AdmZip from "adm-zip";

const GEONAMES_BE_URL = "https://download.geonames.org/export/zip/BE.zip";
const OUTPUT_PATH = join(process.cwd(), "src/data/be-postal-codes.json");

type Entry = {
  commune: string;
  lat: number;
  lng: number;
};

async function main() {
  console.log(`Fetching ${GEONAMES_BE_URL}`);
  const res = await fetch(GEONAMES_BE_URL);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  console.log(`Downloaded ${(buf.length / 1024).toFixed(1)} KiB`);

  const zip = new AdmZip(buf);
  const txt = zip.getEntry("BE.txt");
  if (!txt) throw new Error("BE.txt not found in zip");
  const lines = txt.getData().toString("utf8").split(/\r?\n/);

  const out: Record<string, Entry> = {};
  let skipped = 0;
  let dupes = 0;

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split("\t");
    if (cols.length < 11) {
      skipped++;
      continue;
    }
    const [
      country,
      postal,
      place,
      _admin1,
      _admin1code,
      _admin2,
      _admin2code,
      _admin3,
      _admin3code,
      latStr,
      lngStr,
    ] = cols;

    if (country !== "BE") {
      skipped++;
      continue;
    }
    if (!/^[1-9]\d{3}$/.test(postal)) {
      skipped++;
      continue;
    }
    const lat = Number.parseFloat(latStr);
    const lng = Number.parseFloat(lngStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      skipped++;
      continue;
    }

    if (out[postal]) {
      dupes++;
      continue;
    }
    out[postal] = { commune: place, lat, lng };
  }

  mkdirSync(join(process.cwd(), "src/data"), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(out, null, 2) + "\n", "utf8");

  const count = Object.keys(out).length;
  console.log(`Parsed: ${count} unique postal codes (dupes skipped: ${dupes}, invalid skipped: ${skipped})`);
  console.log(`Sample : 1000 ->`, out["1000"]);
  console.log(`Sample : 4000 ->`, out["4000"]);
  console.log(`Sample : 5000 ->`, out["5000"]);
  console.log(`Written ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
