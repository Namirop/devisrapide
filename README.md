# DevisRapide

> Plateforme web belge de mise en relation particuliers ↔ artisans.
> Modèle pay-per-lead avec wallet rechargeable côté pro.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)
![React](https://img.shields.io/badge/React-19-149eca?logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![Neon](https://img.shields.io/badge/Neon-Postgres-00E599)
![Stripe](https://img.shields.io/badge/Stripe-Checkout-635bff?logo=stripe)

---

## Vue d'ensemble

DevisRapide met en relation des particuliers cherchant un artisan en Belgique
avec des professionnels validés par la plateforme. Le particulier soumet sa
demande via un wizard 6 étapes (univers → catégorie → sous-catégorie →
description → localisation → contact), et le système distribue le lead à 3
artisans max sur la zone via un algorithme de matching géographique (Haversine
SQL custom). Les pros paient à l'unité depuis leur wallet rechargeable
(Stripe Checkout), zéro abonnement.

**Acteurs** :
- **Client** (particulier) — pas de compte authentifié en V1, anonyme
- **Pro** (artisan) — compte auth, wallet, dashboard, leads acceptés / refusés
- **Admin** (Kamel) — panel /admin pour validation pros, lifecycle, wallet override, stats

---

## Statut des sprints

| Sprint | Périmètre | Statut |
|---|---|---|
| 0 | Foundation (Prisma, Auth.js, layouts, seed) | ✅ |
| 1 | Création lead client (wizard particulier) | ✅ |
| 2a | Matching géographique (Haversine, paliers, cron) | ✅ |
| 2b | Dashboard pro lecture (leads disponibles + acceptés) | ✅ |
| 3 | Wallet Stripe Checkout + accept/refuse leads | ✅ |
| 4 | Panel admin (validation, lifecycle, wallet, stats) | ✅ |
| 5a | Audit qualité du code | ✅ ([docs/audit-final.md](docs/audit-final.md)) |
| 5b | Refonte qualité (lint, AuditLog, split modules) | ✅ |
| 5c | Polish prod (Sentry, Turnstile, CSP, Vitest, perf) | ✅ |
| 5.5 | PWA + Push notifications | ✅ |
| notifs-pack | Pack notifications etendu (textes Kamel, B/E/F/G/I, toggles, cron no-match) | ✅ |
| 6 | Launch (env prod, retours Kamel) | ⏳ TODO |

---

## Tech stack

| Couche | Technos |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack, Server Components) + React 19 |
| **Langage** | TypeScript strict, Zod pour la validation runtime |
| **Styling** | Tailwind v4 (`@theme inline`), shadcn/ui primitives, Phosphor icons, Bricolage Grotesque |
| **Base de données** | PostgreSQL (Neon) + Prisma 6 |
| **Auth** | Auth.js v5 + Prisma adapter (Credentials provider, JWT strategy) |
| **Paiement** | Stripe Checkout one-time + webhook idempotent (`StripeWebhookEvent.stripeEventId @unique`) |
| **Animation** | framer-motion (`Reveal` scroll fade) |
| **Rate limit** | Upstash Ratelimit (sliding window) |
| **Hébergement** | Vercel Pro + Vercel Cron |
| **Monitoring** | Sentry (server + client + edge), captureException sur les call-sites critiques (admin actions, cron, Stripe webhook) |
| **Anti-bot** | Cloudflare Turnstile (CAPTCHA invisible) sur `/demande`, `/inscription-pro`, `/connexion` |
| **PWA** | manifest.ts natif Next + service worker manuel + offline fallback + install prompt (Android natif + iOS instructions) |
| **Push** | web-push + VAPID, branchement 8 events (nouveau lead, wallet faible au franchissement, 4 lifecycle, lead offert, lead bientôt expiré, auto-accept declenche, lead pris par un autre) + master-switch `notifyByPush` |
| **Email** | Resend + React Email templates, master-switch `notifyByEmail` via helper `deliver()` requiresOptIn, emails essentials (recharge, lifecycle, lead-offert, no-match client) toujours envoyes |
| **Tests** | Vitest (logique métier pure : pricing, geo, finance, stats) — 41 tests verts |

---

## Setup local

### Prérequis

- **Node** 20+
- **pnpm** 10+
- **PostgreSQL** : compte Neon recommandé (free tier OK), ou Postgres local

### Installation

```bash
# 1. Clone + install
git clone https://github.com/Namirop/devisrapide.git
cd devisrapide
pnpm install

# 2. Copier l'exemple d'env et compléter
cp .env.local.example .env.local
# Au minimum : DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL,
# ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD.
# Variables Stripe/Resend/Upstash/Sentry/Turnstile optionnelles en dev
# (les modules tombent gracefully en no-op si vars absentes — cf. section
# variables d'environnement).

# 3. Appliquer migrations + seed
pnpm db:deploy
pnpm db:seed

# 4. Lancer le dev server
pnpm dev
# → http://localhost:3000
```

### Stripe Checkout en local

Le webhook `/api/stripe/webhook` doit recevoir les events Stripe pour créditer
le wallet. En local, utilise le CLI Stripe :

```bash
# Dans un terminal séparé (laisse tourner)
stripe listen --forward-to localhost:3000/api/stripe/webhook
# → affiche un webhook signing secret "whsec_..."
```

Recopie ce `whsec_...` dans ton `.env.local` comme `STRIPE_WEBHOOK_SECRET`,
relance `pnpm dev`.

**Carte de test** : `4242 4242 4242 4242` / expiration future / CVC quelconque.

### PWA et Push notifications en dev

**VAPID keys** : Générez votre paire via :

```bash
pnpm dlx web-push generate-vapid-keys
```

Et placez `publicKey` / `privateKey` dans `.env.local` (`NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY`). Sans ces variables, `sendPushToProfile` est gracefully no-op (les events déclenchent toujours le code mais aucun push n'est émis), et le composant client `PushSubscriptionManager` affiche une erreur si on tente d'activer.

**Service worker en dev** : par défaut désactivé pour ne pas interférer avec le HMR Turbopack. Pour tester l'enregistrement + flow push en local, set `NEXT_PUBLIC_SW_DEV=1` dans `.env.local`. En vrai test de prod : `pnpm build && pnpm start`.

**Icônes PWA** : régénérables depuis le logo source via `node scripts/generate-pwa-icons.mjs` (sharp). Output : `public/icons/icon-{192,256,384,512}.png` + `icon-maskable-512.png` (safe-zone 80% pour Android).

### Sentry et Turnstile en dev

**Sentry** : Sans `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` configurés, `Sentry.init` est gracefully no-op (pas de network, pas d'erreur). Les capture calls inline (`Sentry.captureException` dans `withAuditLog`, cron, webhook) ne font rien. Pour activer en dev, créer un projet Sentry et coller le DSN dans `.env.local`.

**Cloudflare Turnstile** : Sans `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`, le widget client utilise la sitekey de test Cloudflare `1x00000000000000000000AA` (toujours-pass) et `verifyTurnstileToken` server-side accepte tout token en dev (`NODE_ENV !== "production"`). En prod, les keys deviennent obligatoires (cf. `src/lib/turnstile/verify.ts`). Pour activer en dev : créer un site sur Cloudflare > Turnstile, copier les keys dans `.env.local`.

### Seed dev fakes

Le seed standard crée le catalogue (univers/cat/sub) + 1 admin uniquement.
Pour générer des users / leads / assignments / wallet transactions de test,
définis `SEED_FAKES=true` dans `.env.local` puis relance `pnpm db:seed`. Les
fakes sont idempotents (purge + recréation sur emails `*.test@example.test`).

Voir `prisma/seed-fakes.ts` pour le détail des 8 pros, 5 clients, 12 leads, etc.

---

## Variables d'environnement

| Variable | Requis | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | URL Postgres complète (Neon recommandé) |
| `NEXTAUTH_SECRET` | ✅ | Secret signing JWT (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | ✅ | URL publique (ex: `http://localhost:3000` en dev) |
| `ADMIN_EMAIL` | ✅ | Email admin seedé au premier `db:seed` |
| `ADMIN_INITIAL_PASSWORD` | ✅ | Mot de passe admin initial (changeable depuis `/admin/parametres`) |
| `STRIPE_SECRET_KEY` | ⚠️ Sprint 3+ | Clef secrète Stripe (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ Sprint 3+ | Secret webhook (`whsec_...`, généré par `stripe listen`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ⚠️ Sprint 3+ | Clef publique Stripe (`pk_test_...`) |
| `RESEND_API_KEY` | ⚠️ Sprint 1+ | Si absent : emails tombent en `console.log` |
| `RESEND_FROM_EMAIL` | ⚠️ Sprint 1+ | Default `onboarding@resend.dev` |
| `UPSTASH_REDIS_REST_URL` | ⚠️ | Si absent : rate limit no-op (utile dev) |
| `UPSTASH_REDIS_REST_TOKEN` | ⚠️ | idem |
| `CRON_SECRET` | ⚠️ Sprint 4+ | Bearer token cron Vercel (`openssl rand -hex 32`) |
| `SEED_FAKES` | dev only | `true` pour générer fakes via `db:seed` |
| `SENTRY_DSN` | Sprint 6 | DSN Sentry (côté server) |
| `NEXT_PUBLIC_SENTRY_DSN` | Sprint 6 | DSN Sentry (côté client) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Sprint 5.5 | VAPID public (push subscribe côté navigateur) |
| `VAPID_PRIVATE_KEY` | Sprint 5.5 | VAPID privé (signature serveur, jamais exposé client) |
| `VAPID_SUBJECT` | Sprint 5.5 | `mailto:contact@…` requis par la spec Web Push |
| `NEXT_PUBLIC_SW_DEV` | dev only | `1` pour activer le service worker en dev (default = prod-only pour ne pas casser le HMR) |

Voir `.env.local.example` pour la liste complète et commentée.

---

## Scripts

| Script | Action |
|---|---|
| `pnpm dev` | Dev server (Turbopack, hot reload) |
| `pnpm build` | Build prod (`prisma migrate deploy` + `next build`) |
| `pnpm start` | Sert le build prod |
| `pnpm lint` | ESLint |
| `pnpm db:migrate` | `prisma migrate dev` (nouvelle migration en dev) |
| `pnpm db:deploy` | `prisma migrate deploy` (applique migrations en prod / CI) |
| `pnpm db:seed` | Seed (catalogue + admin + fakes si `SEED_FAKES=true`) |
| `pnpm db:studio` | Prisma Studio UI |
| `pnpm db:generate` | Régénère le client Prisma |
| `pnpm test` | Vitest run (tests unitaires logique métier) |
| `pnpm test:watch` | Vitest mode watch |
| `pnpm test:ui` | Vitest UI (debug visuel) |

---

## Architecture

App Router avec route groups : `(public)` / `(legal)` / `(pro-public)` /
`(dashboard)` / `(admin)`. Server Components par défaut, `'use client'`
placé le plus bas possible dans l'arbre. Server Actions pour les mutations
user-driven, Route Handlers pour les webhooks/cron.

Modèle métier : 3 niveaux de catalogue (Universe → Category → SubCategory),
Lead avec workflow `PENDING_MATCH → ASSIGNED → ACCEPTED → COMPLETED`,
LeadAssignment pivot avec snapshot prix et expiresAt, Wallet en `Int`
(centimes) + WalletTransaction log immuable, AuditLog systématique sur
toutes les actions admin (Sprint 5b).

Voir [`docs/architecture.md`](docs/architecture.md) pour la doc complète
(modèle de données, flow matching, sécurité, RGPD, etc.).

---

## Conventions code

- TypeScript strict, zéro `any` / `as any` douteux
- Result type pattern sur toutes les Server Actions : `{ success: true; data } | { success: false; code; message }`
- `requireProSession()` / `requireAdminSession()` au début de chaque action sensible
- Tous les montants en `Int` représentant des centimes (jamais Float)
- Wallet : transaction Prisma `Serializable` + `SELECT ... FOR UPDATE` sur tout débit
- Webhook Stripe : signature vérifiée + body raw + idempotence par `stripeEventId @unique`
- Conventional commits (`feat:`, `fix:`, `refactor:`, etc.)

Détail complet : [`docs/conventions.md`](docs/conventions.md).

---

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — Document de référence (modèle, flow, sécurité)
- [`docs/conventions.md`](docs/conventions.md) — Conventions de code détaillées
- [`docs/design-system.md`](docs/design-system.md) — Palette, typo, composants UI
- [`docs/manual-testing.md`](docs/manual-testing.md) — Scénarios de test manuels par sprint
- [`docs/v2-roadmap.md`](docs/v2-roadmap.md) — Backlog V2 (hors périmètre MVP)
- [`docs/audit-final.md`](docs/audit-final.md) — Audit qualité Sprint 5a (à jour Sprint 5b)
- `CLAUDE.md` — Conventions critiques pour les sessions Claude Code

---

## Captures

> **Note :** captures à ajouter dans `docs/screenshots/` par Romain. Ratios
> recommandés : 16:10, ~1400px de large, PNG ou WebP optimisé.

### Landing particulier

![Landing particulier](docs/screenshots/landing-particulier.png)
<!-- À ajouter : capture full-page de / en clair, montrant Hero + Stats + HowItWorks -->

### Dashboard pro

![Dashboard pro](docs/screenshots/dashboard-pro.png)
<!-- À ajouter : capture de /dashboard montrant solde wallet + leads disponibles + récents acceptés -->

### Panel admin

![Panel admin](docs/screenshots/admin-home.png)
<!-- À ajouter : capture de /admin home montrant stats + pros pending + leads en souffrance -->

---

## Démo live

Production : *à compléter dès le launch Sprint 6 (URL Vercel custom domain `devisrapide.be`)*

Preview deployments : chaque PR génère une URL Vercel preview unique (cf. PRs ouvertes).

---

## Limitations V1 connues

Documentées dans [`docs/v2-roadmap.md`](docs/v2-roadmap.md) :

- **Clients particuliers anonymes** — pas de login client en V1. Auth.js Email
  magic link prévue en V2 pour permettre au client de revenir voir ses devis.
- **B2B / Copropriétés** — section LP en mode "Bientôt", fonctionnalité V2.
- **RGPD utilisateur** — droits d'accès / effacement traités manuellement
  en V1, endpoints `/dashboard/profil/donnees` prévus V2.
- **Cookie banner CMP** — V1 ne dépose que des cookies essentiels (auth, CSRF,
  Stripe Checkout), pas de CMP requis. À revoir si analytics V2.
- **Cron Vercel** — `vercel.json` configure 2 crons (`process-leads`
  toutes les 15min, `check-no-match-leads` daily 9h). Necessite plan
  Vercel Pro (Hobby limite a 1 cron/jour). En dev local : trigger
  manuel via `curl -H "Authorization: Bearer $CRON_SECRET"`.
- **Tests automatisés** — aucun en V1 (décision pragmatique MVP), couverture
  par tests manuels documentés dans `docs/manual-testing.md`. Vitest/Playwright
  envisagés Sprint 5c polish.

---

## Licence et propriété

Code source DevisRapide — propriété de **Kamel Bonaka** (client).
Prestation technique : **Romain Maes** (dev freelance).

Repo public à des fins de portfolio dev — utilisation, reproduction ou
réutilisation du code soumise à autorisation préalable.

---

## Contact

- Support produit : `contact@devisrapide.be`
- Dev (questions techniques code) : voir profil GitHub `@Namirop`
