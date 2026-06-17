// Capture le rendu réel du tunnel /demande (Sprint E).
// Prereq : `pnpm dev` en cours sur :3000.
// Sortie : tmp/tunnel/*.png
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const URL = `${BASE}/demande?universe=toiture-facade-maconnerie`;

const browser = await chromium.launch({ channel: "chrome" });
await mkdir("tmp/tunnel", { recursive: true });

async function dismissCookies(page) {
  await page
    .getByRole("button", { name: /j'ai compris/i })
    .click()
    .catch(() => {});
  await page.waitForTimeout(150);
}

try {
  // ── Desktop ──
  const ctxD = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { width: 1440, height: 1000 },
  });
  const pD = await ctxD.newPage();
  await pD.goto(URL, { waitUntil: "networkidle", timeout: 60_000 });
  await pD.evaluate(() => document.fonts.ready);
  await pD.waitForTimeout(400);
  await dismissCookies(pD);
  await pD.screenshot({ path: "tmp/tunnel/desktop-1-initial.png" });

  // Coche 2 besoins dans Façade (label desktop = .first() dans le DOM).
  await pD.locator('label:has-text("Crépi & isolation")').first().click().catch(() => {});
  await pD.locator('label:has-text("Peinture façade")').first().click().catch(() => {});
  await pD.waitForTimeout(250);
  await pD.screenshot({ path: "tmp/tunnel/desktop-2-locked.png" });

  // → Étape 2 (Infos).
  await pD.getByRole("button", { name: /continuer/i }).click().catch(() => {});
  await pD.waitForTimeout(500);
  await pD.getByRole("button", { name: /^urgent/i }).first().click().catch(() => {});
  await pD.waitForTimeout(200);
  await pD.screenshot({ path: "tmp/tunnel/desktop-3-info.png" });
  await ctxD.close();

  // ── Mobile ──
  const ctxM = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const pM = await ctxM.newPage();
  await pM.goto(URL, { waitUntil: "networkidle", timeout: 60_000 });
  await pM.evaluate(() => document.fonts.ready);
  await pM.waitForTimeout(400);
  await dismissCookies(pM);
  await pM.getByRole("button", { name: "Façade", exact: true }).click().catch(() => {});
  await pM.waitForTimeout(250);
  // Case mobile = dernier label correspondant dans le DOM (accordéon visible).
  await pM.locator('label:has-text("Crépi & isolation")').last().click().catch(() => {});
  await pM.waitForTimeout(200);
  await pM.screenshot({ path: "tmp/tunnel/mobile-1.png" });

  // → Étape 2 mobile.
  await pM.getByRole("button", { name: /continuer/i }).click().catch(() => {});
  await pM.waitForTimeout(500);
  await pM.evaluate(() => window.scrollTo(0, 0));
  await pM.waitForTimeout(150);
  await pM.screenshot({ path: "tmp/tunnel/mobile-2-info.png" });
  await ctxM.close();
  console.log("done");
} finally {
  await browser.close();
}
