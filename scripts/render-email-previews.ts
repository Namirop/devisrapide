/**
 * Rend les 12 emails transactionnels en HTML (+ PNG si Chrome dispo)
 * dans email-previews/ pour relecture wording/visuel hors envoi réel.
 *
 * Usage : pnpm email:previews   (ou pnpm exec tsx scripts/render-email-previews.ts)
 *
 * Le rendu passe par @react-email/render comme l'envoi réel (sender.ts),
 * avec des données d'exemple neutres. index.html liste chaque mail avec
 * son objet, son destinataire et son déclencheur.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// Script CJS (comme prisma/seed.ts) : __dirname natif, imports @/ via tsx.

import { render } from "@react-email/components";
import type { ReactElement } from "react";

import { LeadAcceptedPro } from "@/lib/email/templates/LeadAcceptedPro";
import { LeadGiftedPro } from "@/lib/email/templates/LeadGiftedPro";
import { LeadReceivedClient } from "@/lib/email/templates/LeadReceivedClient";
import { LowBalancePro } from "@/lib/email/templates/LowBalancePro";
import { NewLeadPro } from "@/lib/email/templates/NewLeadPro";
import { NoMatchClient } from "@/lib/email/templates/NoMatchClient";
import { PasswordResetPro } from "@/lib/email/templates/PasswordResetPro";
import { ProReactivated } from "@/lib/email/templates/ProReactivated";
import { ProRejected } from "@/lib/email/templates/ProRejected";
import { ProSuspended } from "@/lib/email/templates/ProSuspended";
import { ProValidated } from "@/lib/email/templates/ProValidated";
import { RechargeConfirmation } from "@/lib/email/templates/RechargeConfirmation";

const OUT_DIR = join(__dirname, "..", "email-previews");

// Données d'exemple partagées — fictives, aucune donnée réelle.
const demo = {
  clientFirstName: "Marie",
  clientLastName: "Durand",
  clientEmail: "marie.durand@example.com",
  clientPhone: "0470 12 34 56",
  companyName: "Toitures Dupont",
  categoryName: "Toiture",
  subCategoryName: "Réparation de toiture",
  urgencyLabel: "Dès que possible",
  postalCode: "5000",
  city: "Namur",
  address: "Rue de l'Exemple 12",
  description:
    "Quelques tuiles à remplacer suite à la tempête. La toiture est accessible par l'arrière de la maison.",
  assignmentUrl: "https://www.devisrapide.be/dashboard/leads/exemple",
  dashboardUrl: "https://www.devisrapide.be/dashboard",
  walletUrl: "https://www.devisrapide.be/dashboard/wallet",
};

type Preview = {
  /** Nom de fichier (sans extension) + titre technique. */
  slug: string;
  /** Objet réel de l'email (repris de sender.ts). */
  subject: string;
  recipient: string;
  trigger: string;
  element: ReactElement;
};

const previews: Preview[] = [
  {
    slug: "lead-received-client",
    subject: `✅ Demande confirmée : nous cherchons vos experts ${demo.categoryName}`,
    recipient: "Particulier",
    trigger: "Demande de devis enregistrée",
    element: LeadReceivedClient({
      firstName: demo.clientFirstName,
      categoryName: demo.categoryName,
      subCategoryName: demo.subCategoryName,
      city: demo.city,
    }),
  },
  {
    slug: "no-match-client",
    subject: `ℹ️ Point sur votre demande à ${demo.city}`,
    recipient: "Particulier",
    trigger: "Cron quotidien : aucun pro n'a accepté la demande sous 24 h+",
    element: NoMatchClient({ firstName: demo.clientFirstName, city: demo.city }),
  },
  {
    slug: "new-lead-pro",
    subject: `Nouveau lead disponible : ${demo.categoryName} à ${demo.city}`,
    recipient: "Pro (opt-in email)",
    trigger: "Nouveau lead assigné au pro (coordonnées client masquées)",
    element: NewLeadPro({
      clientFirstName: demo.clientFirstName,
      clientLastNameInitial: "D",
      categoryName: demo.categoryName,
      subCategoryName: demo.subCategoryName,
      urgencyLabel: demo.urgencyLabel,
      postalCode: demo.postalCode,
      city: demo.city,
      priceCents: 1500,
      assignmentUrl: demo.assignmentUrl,
    }),
  },
  {
    slug: "lead-accepted-pro",
    subject: `✅ Lead accepté : coordonnées de ${demo.clientFirstName}`,
    recipient: "Pro (opt-in email)",
    trigger: "Lead accepté (manuel ou auto-accept) → coordonnées complètes",
    element: LeadAcceptedPro({
      companyName: demo.companyName,
      clientFirstName: demo.clientFirstName,
      clientLastName: demo.clientLastName,
      clientEmail: demo.clientEmail,
      clientPhone: demo.clientPhone,
      categoryName: demo.categoryName,
      subCategoryName: demo.subCategoryName,
      urgencyLabel: demo.urgencyLabel,
      postalCode: demo.postalCode,
      city: demo.city,
      address: demo.address,
      description: demo.description,
      priceCents: 1500,
      assignmentUrl: demo.assignmentUrl,
    }),
  },
  {
    slug: "lead-gifted-pro",
    subject: `Lead offert — coordonnées de ${demo.clientFirstName} ${demo.clientLastName}`,
    recipient: "Pro",
    trigger: "Lead offert gratuitement par l'admin",
    element: LeadGiftedPro({
      clientFirstName: demo.clientFirstName,
      clientLastName: demo.clientLastName,
      clientEmail: demo.clientEmail,
      clientPhone: demo.clientPhone,
      categoryName: demo.categoryName,
      subCategoryName: demo.subCategoryName,
      urgencyLabel: demo.urgencyLabel,
      postalCode: demo.postalCode,
      city: demo.city,
      address: demo.address,
      description: demo.description,
      adminNote: "Geste commercial suite à un lead non conforme la semaine dernière.",
    }),
  },
  {
    slug: "low-balance-pro",
    subject: "⚠️ Attention : votre solde DevisRapide est bientôt vide",
    recipient: "Pro (opt-in email)",
    trigger: "Solde wallet passé sous le seuil après un débit lead",
    element: LowBalancePro({
      companyName: demo.companyName,
      balanceCents: 800,
      walletUrl: demo.walletUrl,
    }),
  },
  {
    slug: "recharge-confirmation",
    subject: "✅ Recharge confirmée : +110,00 € sur votre wallet",
    recipient: "Pro",
    trigger: "Paiement Stripe confirmé (webhook checkout.session.completed)",
    element: RechargeConfirmation({
      companyName: demo.companyName,
      packLabel: "Pack Pro — 100 €",
      amountCreditedCents: 11000,
      bonusCents: 1000,
      newBalanceCents: 11800,
      stripePaymentIntentId: "pi_EXEMPLE123",
      transactionDate: new Date("2026-07-26T10:30:00+02:00"),
      walletUrl: demo.walletUrl,
    }),
  },
  {
    slug: "pro-validated",
    subject: "Votre compte DevisRapide est validé",
    recipient: "Pro",
    trigger: "Compte validé par l'admin",
    element: ProValidated({
      companyName: demo.companyName,
      dashboardUrl: demo.dashboardUrl,
    }),
  },
  {
    slug: "pro-rejected",
    subject: "Votre candidature DevisRapide n'a pas été retenue",
    recipient: "Pro",
    trigger: "Candidature refusée par l'admin (raison incluse)",
    element: ProRejected({
      companyName: demo.companyName,
      reason:
        "Le numéro BCE communiqué ne correspond pas à une activité couverte par la plateforme.",
    }),
  },
  {
    slug: "pro-suspended",
    subject: "Votre compte DevisRapide a été suspendu",
    recipient: "Pro",
    trigger: "Compte suspendu par l'admin (raison incluse)",
    element: ProSuspended({
      companyName: demo.companyName,
      reason: "Plusieurs leads acceptés sans prise de contact avec les clients.",
    }),
  },
  {
    slug: "pro-reactivated",
    subject: "Votre compte DevisRapide a été réactivé",
    recipient: "Pro",
    trigger: "Compte réactivé par l'admin",
    element: ProReactivated({
      companyName: demo.companyName,
      dashboardUrl: demo.dashboardUrl,
    }),
  },
  {
    slug: "password-reset-pro",
    subject: "Réinitialisez votre mot de passe DevisRapide",
    recipient: "Pro",
    trigger: "Demande via /mot-de-passe-oublie (lien valable 1 h)",
    element: PasswordResetPro({
      resetUrl: "https://www.devisrapide.be/reinitialiser-mot-de-passe/exemple",
    }),
  },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });

  for (const p of previews) {
    const html = await render(p.element);
    writeFileSync(join(OUT_DIR, `${p.slug}.html`), html, "utf8");
    console.log(`✓ ${p.slug}.html`);
  }

  const cards = previews
    .map(
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
    )
    .join("\n");

  const index = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>DevisRapide — aperçu des ${previews.length} emails transactionnels</title>
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
     Généré par <code>scripts/render-email-previews.mts</code>.</p>
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
    for (const p of previews) {
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
