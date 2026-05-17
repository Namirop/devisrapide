#!/usr/bin/env node
/** Lieux ou une lib est chargee. Usage: node scripts/where-pkg.mjs <pkg-name> */
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

function findIn(node, chunk) {
  if (node.path && new RegExp(`node_modules/\\.pnpm/[^/]+/node_modules/${NEEDLE.replace(/\//g, "\\/")}(/|$)`).test(node.path)) {
    return node.parsedSize ?? 0;
  }
  let sum = 0;
  if (node.groups) for (const g of node.groups) sum += findIn(g, chunk);
  return sum;
}

console.log(`Lib : ${NEEDLE}\n`);
let total = 0;
for (const chunk of chartData) {
  const sz = findIn(chunk, chunk.label);
  if (sz > 0) {
    console.log(`  ${fmt(sz).padEnd(10)}  ${chunk.label}`);
    total += sz;
  }
}
console.log(`\nTotal parsed (client) : ${fmt(total)}`);
