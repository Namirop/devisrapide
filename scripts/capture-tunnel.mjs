// Capture le rendu réel de l'étape 1 du tunnel /demande (Sprint E).
// Prereq : `pnpm dev` en cours sur :3000.
// Sortie : tmp/tunnel/*.png
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const URL = `${BASE}/demande?universe=toiture-facade-maconnerie`;

const browser = await chromium.launch({ channel: "chrome" });
await mkdir("tmp/tunnel", { recursive: true });
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
  console.log("desktop URL:", pD.url());
  // Ferme le bandeau cookies (site-wide) pour une capture propre.
  await pD
    .getByRole("button", { name: /j'ai compris/i })
    .click()
    .catch(() => {});
  await pD.waitForTimeout(200);
  await pD.screenshot({ path: "tmp/tunnel/desktop-1-initial.png" });

  // Coche un besoin dans Façade → les autres cards se verrouillent.
  await pD
    .locator('label:has-text("Crépi & isolation")')
    .first()
    .click()
    .catch((e) => console.log("click1 failed:", e.message));
  await pD
    .locator('label:has-text("Peinture façade")')
    .first()
    .click()
    .catch(() => {});
  await pD.waitForTimeout(300);
  await pD.screenshot({ path: "tmp/tunnel/desktop-2-locked.png" });
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
  await pM
    .getByRole("button", { name: /j'ai compris/i })
    .click()
    .catch(() => {});
  await pM.waitForTimeout(200);
  // Ouvre la catégorie "Façade" de l'accordéon (nom exact → pas la chip).
  await pM
    .getByRole("button", { name: "Façade", exact: true })
    .click()
    .catch((e) => console.log("mobile open failed:", e.message));
  await pM.waitForTimeout(300);
  // Coche un besoin pour montrer le compteur + l'état actif.
  await pM
    .locator('label:has-text("Crépi & isolation")')
    .first()
    .click()
    .catch(() => {});
  await pM.waitForTimeout(200);
  await pM.screenshot({ path: "tmp/tunnel/mobile-1.png" });
  await ctxM.close();
  console.log("done");
} finally {
  await browser.close();
}
