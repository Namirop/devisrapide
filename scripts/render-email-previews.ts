/**
 * Rend les 12 emails transactionnels en HTML (+ PNG si Chrome dispo)
 * dans email-previews/ pour relecture wording/visuel hors envoi réel.
 *
 * Usage : pnpm email:previews   (ou pnpm exec tsx scripts/render-email-previews.ts)
 *
 * Le catalogue (templates + données d'exemple + objets) vit dans
 * src/lib/email/previews.ts, partagé avec la page d'aperçu en ligne.
 * Le rendu passe par @react-email/render comme l'envoi réel (sender.ts).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { render } from "@react-email/components";

import { EMAIL_PREVIEWS } from "@/lib/email/previews";

// Script CJS (comme prisma/seed.ts) : __dirname natif, imports @/ via tsx.
const OUT_DIR = join(__dirname, "..", "email-previews");

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });

  for (const p of EMAIL_PREVIEWS) {
    const html = await render(p.element);
    writeFileSync(join(OUT_DIR, `${p.slug}.html`), html, "utf8");
    console.log(`✓ ${p.slug}.html`);
  }

  const cards = EMAIL_PREVIEWS.map(
    (p) => `
      <article>
        <header>
          <h2>${escapeHtml(p.subject)}</h2>
          <p><strong>Destinataire :</strong> ${escapeHtml(p.recipient)} ·
             <strong>Envoyé quand :</strong> ${escapeHtml(p.trigger)} ·
             <a href="./${p.slug}.html" target="_blank">ouvrir seul</a></p>
        </header>
        <iframe src="./${p.slug}.html" loading="lazy" title="${escapeHtml(p.subject)}"></iframe>
      </article>`,
  ).join("\n");

  const index = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>DevisRapide — aperçu des ${EMAIL_PREVIEWS.length} emails transactionnels</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; background: #f1f5f9; color: #0f172a; }
  .intro { max-width: 720px; margin: 0 auto; padding: 32px 24px 8px; }
  main { display: grid; grid-template-columns: repeat(auto-fill, minmax(680px, 1fr)); gap: 32px; padding: 24px; }
  article { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  article header { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
  article h2 { font-size: 16px; margin: 0 0 6px; }
  article p { font-size: 13px; color: #475569; margin: 0; }
  iframe { width: 100%; height: 720px; border: 0; background: #f8fafc; }
</style>
</head>
<body>
<div class="intro">
  <h1>Aperçu des emails transactionnels</h1>
  <p>Rendus avec les vrais templates et des données d'exemple fictives.
     Généré par <code>scripts/render-email-previews.ts</code>.</p>
</div>
<main>${cards}</main>
</body>
</html>`;
  writeFileSync(join(OUT_DIR, "index.html"), index, "utf8");
  console.log("✓ index.html");

  await captureScreenshots().catch((err: unknown) => {
    console.warn(
      "PNG non générés (Chrome introuvable ?) — les HTML suffisent pour la relecture.",
      err instanceof Error ? err.message : err,
    );
  });
}

/** Captures PNG (700px de large, pleine hauteur) via le Chrome installé. */
async function captureScreenshots(): Promise<void> {
  const { chromium } = await import("playwright-core");
  const browser = await chromium.launch({ channel: "chrome" });
  try {
    const page = await browser.newPage({ viewport: { width: 700, height: 900 } });
    for (const p of EMAIL_PREVIEWS) {
      await page.goto(pathToFileURL(join(OUT_DIR, `${p.slug}.html`)).href);
      await page.screenshot({
        path: join(OUT_DIR, `${p.slug}.png`),
        fullPage: true,
      });
      console.log(`✓ ${p.slug}.png`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
