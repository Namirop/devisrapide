#!/usr/bin/env node
/**
 * Extrait un resume lisible du rapport bundle-analyzer.
 *
 * Lit .next/analyze/client.html, en extrait window.chartData (JSON
 * embarque par webpack-bundle-analyzer), agrege par package npm
 * top-level, et imprime un tableau trie par parsedSize.
 *
 * Usage : node scripts/bundle-report.mjs [--top N]
 */
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const HTML = resolve(ROOT, ".next/analyze/client.html");

const TOP = (() => {
  const i = process.argv.indexOf("--top");
  return i > -1 ? Number(process.argv[i + 1]) : 30;
})();

const html = await readFile(HTML, "utf8");
const startMarker = "window.chartData = ";
const start = html.indexOf(startMarker);
if (start < 0) {
  console.error("chartData introuvable");
  process.exit(1);
}
// Recherche fin balanced : trouve la position du `;</script>` qui ferme
let i = start + startMarker.length;
let depth = 0;
let end = -1;
let inStr = false;
let escape = false;
for (; i < html.length; i++) {
  const c = html[i];
  if (escape) {
    escape = false;
    continue;
  }
  if (c === "\\" && inStr) {
    escape = true;
    continue;
  }
  if (c === '"') {
    inStr = !inStr;
    continue;
  }
  if (inStr) continue;
  if (c === "[") depth++;
  else if (c === "]") {
    depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
}
if (end < 0) {
  console.error("Fin du chartData introuvable");
  process.exit(1);
}
const chartData = JSON.parse(html.slice(start + startMarker.length, end));

// Aggregate par package top-level (extrait nom depuis path)
const byPkg = new Map();
function walk(node, chunk) {
  if (node.path && /node_modules\/\.pnpm\/([^/]+)\/node_modules\/((?:@[^/]+\/)?[^/]+)/.test(node.path)) {
    const match = node.path.match(/node_modules\/\.pnpm\/[^/]+\/node_modules\/((?:@[^/]+\/)?[^/]+)/);
    const pkg = match[1];
    const cur = byPkg.get(pkg) ?? { stat: 0, parsed: 0, gzip: 0 };
    cur.stat += node.statSize ?? 0;
    cur.parsed += node.parsedSize ?? 0;
    cur.gzip += node.gzipSize ?? 0;
    byPkg.set(pkg, cur);
    return;
  }
  if (node.groups) for (const g of node.groups) walk(g, chunk);
}

let chunkTotalParsed = 0;
let chunkTotalGzip = 0;
for (const chunk of chartData) {
  chunkTotalParsed += chunk.parsedSize ?? 0;
  chunkTotalGzip += chunk.gzipSize ?? 0;
  if (chunk.groups) for (const g of chunk.groups) walk(g, chunk.label);
}

const fmt = (b) => {
  if (b > 1024 * 1024) return (b / 1024 / 1024).toFixed(2) + " MB";
  if (b > 1024) return (b / 1024).toFixed(1) + " kB";
  return b + " B";
};

console.log(`Total CLIENT bundle : ${fmt(chunkTotalParsed)} parsed / ${fmt(chunkTotalGzip)} gzip`);
console.log(`Chunks count        : ${chartData.length}`);
console.log();
console.log(`Top ${TOP} npm packages (parsed size) :`);
console.log("─".repeat(70));
console.log("rank  parsed       gzip         package");
console.log("─".repeat(70));

const sorted = [...byPkg.entries()].sort(
  (a, b) => b[1].parsed - a[1].parsed,
);
sorted.slice(0, TOP).forEach(([pkg, sizes], i) => {
  const rank = String(i + 1).padStart(3);
  const p = fmt(sizes.parsed).padEnd(12);
  const g = fmt(sizes.gzip).padEnd(12);
  console.log(`${rank}.  ${p} ${g} ${pkg}`);
});
console.log();
console.log(`Chunks > 100kB parsed :`);
chartData
  .filter((c) => (c.parsedSize ?? 0) > 100 * 1024)
  .sort((a, b) => b.parsedSize - a.parsedSize)
  .forEach((c) => {
    console.log(`  ${fmt(c.parsedSize).padEnd(12)} ${c.label}`);
  });
