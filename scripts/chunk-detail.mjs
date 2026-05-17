#!/usr/bin/env node
/** Top contributeurs d'UN chunk specifique. Usage: node scripts/chunk-detail.mjs <chunk-prefix> */
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML = resolve(__dirname, "..", ".next/analyze/client.html");
const NEEDLE = process.argv[2] ?? "";

const html = await readFile(HTML, "utf8");
const start = html.indexOf("window.chartData = ");
let i = start + "window.chartData = ".length;
let depth = 0, inStr = false, escape = false, end = -1;
for (; i < html.length; i++) {
  const c = html[i];
  if (escape) { escape = false; continue; }
  if (c === "\\" && inStr) { escape = true; continue; }
  if (c === '"') { inStr = !inStr; continue; }
  if (inStr) continue;
  if (c === "[") depth++;
  else if (c === "]") { depth--; if (depth === 0) { end = i + 1; break; } }
}
const chartData = JSON.parse(html.slice(start + "window.chartData = ".length, end));

const fmt = (b) => b > 1024*1024 ? (b/1024/1024).toFixed(2)+" MB" : b > 1024 ? (b/1024).toFixed(1)+" kB" : b+" B";

const chunk = chartData.find((c) => c.label.includes(NEEDLE));
if (!chunk) {
  console.error("Chunk introuvable, prefixes dispos :");
  chartData.forEach((c) => console.error("  ", c.label));
  process.exit(1);
}
console.log(`Chunk : ${chunk.label}`);
console.log(`Total : ${fmt(chunk.parsedSize)} parsed / ${fmt(chunk.gzipSize)} gzip`);
console.log();

const byPkg = new Map();
function walk(node) {
  if (node.path && /node_modules\/\.pnpm\/[^/]+\/node_modules\/((?:@[^/]+\/)?[^/]+)/.test(node.path)) {
    const pkg = node.path.match(/node_modules\/\.pnpm\/[^/]+\/node_modules\/((?:@[^/]+\/)?[^/]+)/)[1];
    const cur = byPkg.get(pkg) ?? { stat: 0, parsed: 0, gzip: 0 };
    cur.stat += node.statSize ?? 0;
    cur.parsed += node.parsedSize ?? 0;
    cur.gzip += node.gzipSize ?? 0;
    byPkg.set(pkg, cur);
    return;
  }
  if (node.groups) for (const g of node.groups) walk(g);
}
if (chunk.groups) for (const g of chunk.groups) walk(g);

[...byPkg.entries()].sort((a,b) => b[1].parsed - a[1].parsed).slice(0, 20).forEach(([p, s]) => {
  console.log(`  ${fmt(s.parsed).padEnd(12)} ${fmt(s.gzip).padEnd(10)} ${p}`);
});
