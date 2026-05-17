#!/usr/bin/env node
/**
 * Compare 2 rapports webpack-bundle-analyzer.
 * Usage : node scripts/bundle-compare.mjs <before.html> <after.html>
 *
 * Affiche le delta agrege par package npm, et le delta total.
 */
import { readFile } from "node:fs/promises";

function extractChartData(html) {
  const start = html.indexOf("window.chartData = ");
  let i = start + "window.chartData = ".length;
  let depth = 0,
    inStr = false,
    escape = false,
    end = -1;
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
  return JSON.parse(html.slice(start + "window.chartData = ".length, end));
}

function aggregateByPkg(chartData) {
  const byPkg = new Map();
  let totalParsed = 0;
  let totalGzip = 0;
  function walk(node) {
    if (
      node.path &&
      /node_modules\/\.pnpm\/[^/]+\/node_modules\/((?:@[^/]+\/)?[^/]+)/.test(
        node.path,
      )
    ) {
      const pkg = node.path.match(
        /node_modules\/\.pnpm\/[^/]+\/node_modules\/((?:@[^/]+\/)?[^/]+)/,
      )[1];
      const cur = byPkg.get(pkg) ?? { parsed: 0, gzip: 0 };
      cur.parsed += node.parsedSize ?? 0;
      cur.gzip += node.gzipSize ?? 0;
      byPkg.set(pkg, cur);
      return;
    }
    if (node.groups) for (const g of node.groups) walk(g);
  }
  for (const chunk of chartData) {
    totalParsed += chunk.parsedSize ?? 0;
    totalGzip += chunk.gzipSize ?? 0;
    if (chunk.groups) for (const g of chunk.groups) walk(g);
  }
  return { byPkg, totalParsed, totalGzip };
}

const fmt = (b) => {
  const sign = b < 0 ? "-" : b > 0 ? "+" : " ";
  const abs = Math.abs(b);
  if (abs > 1024 * 1024) return sign + (abs / 1024 / 1024).toFixed(2) + " MB";
  if (abs > 1024) return sign + (abs / 1024).toFixed(1) + " kB";
  return sign + abs + " B";
};

const [, , beforePath, afterPath] = process.argv;
const before = aggregateByPkg(extractChartData(await readFile(beforePath, "utf8")));
const after = aggregateByPkg(extractChartData(await readFile(afterPath, "utf8")));

console.log("=== TOTAL CLIENT BUNDLE ===");
console.log(
  `Before : ${(before.totalParsed / 1024).toFixed(1)} kB parsed / ${(before.totalGzip / 1024).toFixed(1)} kB gzip`,
);
console.log(
  `After  : ${(after.totalParsed / 1024).toFixed(1)} kB parsed / ${(after.totalGzip / 1024).toFixed(1)} kB gzip`,
);
console.log(
  `Delta  : ${fmt(after.totalParsed - before.totalParsed)} parsed / ${fmt(after.totalGzip - before.totalGzip)} gzip`,
);
console.log();
console.log("=== PACKAGES (delta != 0) ===");
const allPkgs = new Set([...before.byPkg.keys(), ...after.byPkg.keys()]);
const deltas = [];
for (const pkg of allPkgs) {
  const b = before.byPkg.get(pkg) ?? { parsed: 0, gzip: 0 };
  const a = after.byPkg.get(pkg) ?? { parsed: 0, gzip: 0 };
  const dp = a.parsed - b.parsed;
  const dg = a.gzip - b.gzip;
  if (Math.abs(dp) > 100) {
    deltas.push({ pkg, dp, dg, before: b.parsed, after: a.parsed });
  }
}
deltas.sort((a, b) => Math.abs(b.dp) - Math.abs(a.dp));
console.log(
  "parsed delta  gzip delta    before        after         package",
);
console.log("─".repeat(85));
for (const d of deltas) {
  console.log(
    `${fmt(d.dp).padEnd(13)} ${fmt(d.dg).padEnd(13)} ${(d.before > 0 ? (d.before / 1024).toFixed(1) + " kB" : "—").padEnd(13)} ${(d.after > 0 ? (d.after / 1024).toFixed(1) + " kB" : "—").padEnd(13)} ${d.pkg}`,
  );
}
