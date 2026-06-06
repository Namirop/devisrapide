// Capture nette du dashboard mockup pour le laptop de la LP pro.
// Lance le Chrome installe (via playwright-core, channel "chrome"), charge
// /mockup/dashboard, attend les web fonts, puis screenshot l'element
// #mockup-canvas a deviceScaleFactor 2 → PNG net dans tmp/.
//
// Prereq : `pnpm dev` (ou next start) en cours sur :3000.
// Usage  : pnpm capture:mockup   (puis pnpm composite:mockup)
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

const URL = process.env.MOCKUP_URL ?? "http://localhost:3000/mockup/dashboard";
const OUT = process.env.MOCKUP_OUT ?? "tmp/mockup-shot.png";

const browser = await chromium.launch({ channel: "chrome" });
try {
  const context = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60_000 });
  // Attendre le chargement des web fonts (sinon FOUT dans la capture).
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);

  const canvas = page.locator("#mockup-canvas");
  await canvas.waitFor({ state: "visible" });
  await mkdir("tmp", { recursive: true });
  await canvas.screenshot({ path: OUT });
  console.log(`captured → ${OUT}`);
} finally {
  await browser.close();
}
