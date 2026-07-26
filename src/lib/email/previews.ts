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

// Catalogue des 12 emails transactionnels rendus avec des données d'exemple
// fictives, pour relecture wording/visuel hors envoi réel. Consommé par
// scripts/render-email-previews.ts (HTML + PNG locaux) et par la page
// d'aperçu en ligne. Les objets (`subject`) sont recopiés de sender.ts.

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

export type EmailPreview = {
  /** Identifiant URL/fichier (kebab-case). */
  slug: string;
  /** Objet réel de l'email (repris de sender.ts). */
  subject: string;
  recipient: string;
  trigger: string;
  element: ReactElement;
};

export const EMAIL_PREVIEWS: EmailPreview[] = [
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
      adminNote:
        "Geste commercial suite à un lead non conforme la semaine dernière.",
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
