<h1 align="center">DevisRapide</h1>

<p align="center">
  Plateforme web belge de mise en relation particuliers ↔ artisans.<br>
  Modèle pay-per-lead avec wallet rechargeable côté pro.<br>
  <a href="https://devisrapide.be">devisrapide.be</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/Neon-Postgres-00E599" alt="Neon">
  <img src="https://img.shields.io/badge/Stripe-Checkout-635bff?logo=stripe&logoColor=white" alt="Stripe">
</p>

<p align="center">
  <img src="docs/images/01-couverture.jpg" alt="DevisRapide : particuliers et artisans belges mis en relation par projet" width="100%">
</p>

<p align="center">
  <img src="docs/images/02-demande.jpg" alt="Demande de devis en trois étapes" width="32%">
  <img src="docs/images/03-leads.jpg" alt="Leads disponibles côté artisan" width="32%">
  <img src="docs/images/04-espace-artisan.jpg" alt="Tableau de bord et wallet de l'artisan" width="32%">
</p>

<p align="center">
  <sub>Demande en trois étapes · Leads côté artisan · Espace artisan et wallet</sub>
</p>

---

## Vue d'ensemble

DevisRapide met en relation des particuliers cherchant un artisan en Belgique
avec des professionnels validés par la plateforme. Le particulier soumet sa
demande via un wizard en 3 étapes (projet → infos → coordonnées), et le
système propose le lead à tous les artisans validés de la zone via un
algorithme de matching géographique (Haversine SQL custom), le rayon
s'élargissant progressivement par paliers. Un nombre limité et configurable
d'entre eux peut l'acheter depuis son wallet rechargeable (Stripe Checkout) :
plusieurs pour un lead partagé, un seul pour un lead exclusif.

**Acteurs** :

- **Client** (particulier) — sans compte : nom, email et téléphone saisis dans la demande
- **Pro** (artisan) — compte auth, wallet, dashboard, leads acceptés / refusés
- **Admin** — panel /admin pour validation pros, lifecycle, wallet override, stats

---

## Tech stack

| Couche              | Technos                                                                                                                                                                                                                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**       | Next.js 16 (App Router, Turbopack, Server Components) + React 19                                                                                                                                                                                                                                                                        |
| **Langage**         | TypeScript strict, Zod pour la validation runtime                                                                                                                                                                                                                                                                                       |
| **Styling**         | Tailwind v4 (`@theme inline`), shadcn/ui primitives, Phosphor icons, polices auto-hébergées (Bricolage Grotesque, Inter, Plus Jakarta Sans)                                                                                                                                                                                             |
| **Base de données** | PostgreSQL (Neon) + Prisma 6                                                                                                                                                                                                                                                                                                            |
| **Auth**            | Auth.js v5 (beta) + Prisma adapter (Credentials provider, JWT strategy)                                                                                                                                                                                                                                                                 |
| **Paiement**        | Stripe Checkout one-time + webhook idempotent (`StripeWebhookEvent.stripeEventId @unique`)                                                                                                                                                                                                                                              |
| **Animation**       | CSS-only `Reveal` (IntersectionObserver) sur landing + framer-motion `AnimatePresence` sur wizards                                                                                                                                                                                                                                      |
| **Rate limit**      | Upstash Ratelimit (sliding window)                                                                                                                                                                                                                                                                                                      |
| **Hébergement**     | Vercel Pro + Vercel Cron                                                                                                                                                                                                                                                                                                                |
| **Alerting**        | Heartbeat Better Stack : `pingCronHeartbeat()` en fin de run cron, `reportIncident()` sur les pannes qui ne se voient nulle part ailleurs (paiements Stripe non crédités, action admin en échec, crons, création de lead, envoi d'e-mail, rattrapage de matching, reprises Serializable épuisées) + alerte e-mail sur le quota d'envois |
| **Anti-bot**        | Cloudflare Turnstile (CAPTCHA invisible) sur `/demande`, `/inscription-pro`, `/connexion`, `/mot-de-passe-oublie`                                                                                                                                                                                                                       |
| **PWA**             | manifest.ts natif Next + service worker manuel + offline fallback + install prompt (Android natif + iOS instructions)                                                                                                                                                                                                                   |
| **Push**            | web-push + VAPID, 10 events branchés (nouveau lead, auto-accept déclenché, lead pris par un autre, wallet faible au franchissement, lead bientôt expiré, lead offert, 4 lifecycle pro) + master-switch `notifyByPush`                                                                                                                   |
| **Email**           | Resend + 14 templates React Email, master-switch `notifyByEmail` via helper `deliver()` `requiresOptIn` ; les essentiels (recharge, lifecycle, lead offert, no-match client, alerte admin) partent toujours. Compteur d'envois quotidiens (Redis) → alerte à 60/100, le plafond de l'offre gratuite                                     |
| **Tests**           | Vitest sur la logique métier pure : pricing, géo, stats, masquage des coordonnées, règles de matching                                                                                                                                                                                                                                   |

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
cp .env.local.example .env
# Prisma CLI (migrations, seed) ne lit que .env ; Next lit .env et .env.local.
# Au minimum : DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, NEXTAUTH_URL,
# ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD, et STRIPE_SECRET_KEY non vide (le SDK
# Stripe refuse une clé vide dès l'import ; une valeur factice suffit sans
# paiement). Resend, Upstash, Turnstile, Better Stack et VAPID sont
# optionnels en dev : les modules passent en no-op si leurs variables manquent.

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

### Alerting et Turnstile en dev

**Alerting** : sans `BETTERSTACK_HEARTBEAT_URL`, `reportIncident()` et `pingCronHeartbeat()` se limitent au `console.error` — aucun appel réseau, aucune erreur. Pour tester le canal en dev, créer un heartbeat sur Better Stack et coller son URL dans `.env.local`.

**Cloudflare Turnstile** : Sans `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`, le widget client utilise la sitekey de test Cloudflare `1x00000000000000000000AA` (toujours-pass) et `verifyTurnstileToken` server-side accepte tout token en dev (`NODE_ENV !== "production"`). En prod, les keys deviennent obligatoires (cf. `src/lib/turnstile/verify.ts`). Pour activer en dev : créer un site sur Cloudflare > Turnstile, copier les keys dans `.env.local`.

### Seed dev fakes

`pnpm db:seed` crée le catalogue + un admin. Pour ajouter des données de test
(pros, leads, wallet) utiles au test des espaces pro/admin :
`pnpm db:seed:fakes` (idempotent, cf. `prisma/seed-fakes.ts`).

---

## Variables d'environnement

| Variable                                              | Requis      | Description                                                                                                                                           |
| ----------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                        | ✅          | URL Postgres complète, endpoint **poolé** (Neon recommandé) — lue au runtime                                                                          |
| `DIRECT_URL`                                          | ✅          | Même base, endpoint **direct** (hostname sans `-pooler`) — `schema.prisma` la déclare en `directUrl` ; `prisma migrate` et le seed échouent sans elle |
| `NEXTAUTH_SECRET`                                     | ✅          | Secret signing JWT (`openssl rand -base64 32`) — `AUTH_SECRET` est accepté à la place                                                                 |
| `NEXTAUTH_URL`                                        | ✅          | URL publique (ex: `http://localhost:3000` en dev)                                                                                                     |
| `ADMIN_EMAIL`                                         | ✅          | Email admin seedé au premier `db:seed`                                                                                                                |
| `ADMIN_INITIAL_PASSWORD`                              | ✅          | Mot de passe admin initial (changeable depuis `/admin/parametres`)                                                                                    |
| `STRIPE_SECRET_KEY`                                   | ✅          | Clef secrète Stripe (`sk_test_...`) — non vide, même factice sans paiement                                                                            |
| `STRIPE_WEBHOOK_SECRET`                               | ⚠️ Paiement | Secret webhook (`whsec_...`, généré par `stripe listen`)                                                                                              |
| `RESEND_API_KEY`                                      | ⚠️ Email    | Si absent : emails tombent en `console.log`                                                                                                           |
| `RESEND_FROM_EMAIL`                                   | ⚠️ Email    | Default `onboarding@resend.dev`                                                                                                                       |
| `UPSTASH_REDIS_REST_URL`                              | ⚠️          | Si absent : rate limit no-op (utile dev)                                                                                                              |
| `UPSTASH_REDIS_REST_TOKEN`                            | ⚠️          | idem                                                                                                                                                  |
| `CRON_SECRET`                                         | ⚠️ Cron     | Bearer token cron Vercel (`openssl rand -hex 32`)                                                                                                     |
| `BETTERSTACK_HEARTBEAT_URL`                           | ⚪ Alerting | URL(s) du heartbeat, séparées par des virgules (contiennent le token). Absente : incidents en console seulement                                       |
| `ALERT_EMAIL`                                         | ⚪ Alerting | Destinataires de l'alerte quota e-mail (60/100), séparés par des virgules                                                                             |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`                        | ⚪ Push     | VAPID public (push subscribe côté navigateur)                                                                                                         |
| `VAPID_PRIVATE_KEY`                                   | ⚪ Push     | VAPID privé (signature serveur, jamais exposé client)                                                                                                 |
| `VAPID_SUBJECT`                                       | ⚪ Push     | `mailto:contact@…` requis par la spec Web Push                                                                                                        |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`                      | ⚠️ Prod     | Sitekey Turnstile (clé de test Cloudflare utilisée si absente)                                                                                        |
| `TURNSTILE_SECRET_KEY`                                | ⚠️ Prod     | Secret Turnstile (vérification acceptée sans clé hors production)                                                                                     |
| `LAUNCH_PROTECT_ENABLED`                              | ⚪          | `true` : le site exige une authentification Basic (verrou de pré-lancement)                                                                           |
| `LAUNCH_PROTECT_USERNAME` / `LAUNCH_PROTECT_PASSWORD` | ⚪          | Identifiants du verrou de pré-lancement                                                                                                               |
| `NEXT_PUBLIC_SW_DEV`                                  | dev only    | `1` pour activer le service worker en dev (default = prod-only pour ne pas casser le HMR)                                                             |
| `ANALYZE`                                             | dev only    | `true` au build pour ouvrir le bundle analyzer                                                                                                        |

Voir `.env.local.example` pour la liste complète et commentée.

---

## Scripts

| Script               | Action                                                     |
| -------------------- | ---------------------------------------------------------- |
| `pnpm dev`           | Dev server (Turbopack, hot reload)                         |
| `pnpm build`         | Build prod (`prisma migrate deploy` + `next build`)        |
| `pnpm start`         | Sert le build prod                                         |
| `pnpm lint`          | ESLint                                                     |
| `pnpm db:migrate`    | `prisma migrate dev` (nouvelle migration en dev)           |
| `pnpm db:deploy`     | `prisma migrate deploy` (applique migrations en prod / CI) |
| `pnpm db:seed`       | Seed catalogue + admin                                     |
| `pnpm db:seed:fakes` | Ajoute des données de test (pros, leads, wallet)           |
| `pnpm db:studio`     | Prisma Studio UI                                           |
| `pnpm db:generate`   | Régénère le client Prisma                                  |
| `pnpm test`          | Vitest run (tests unitaires logique métier)                |
| `pnpm test:watch`    | Vitest mode watch                                          |
| `pnpm test:ui`       | Vitest UI (debug visuel)                                   |

---

## Architecture

App Router avec route groups : `(public)` / `(legal)` / `(pro-public)` /
`(dashboard)` / `(admin)`. Server Components par défaut, `'use client'`
placé le plus bas possible dans l'arbre. Server Actions pour les mutations
user-driven, Route Handlers pour les webhooks/cron.

Modèle métier : 3 niveaux de catalogue (Universe → Category → SubCategory),
Lead `PENDING_MATCH` → `ACCEPTED` (plafond d'acheteurs atteint) | `EXPIRED`
(délai dépassé) | `CANCELLED` (suppression admin), la qualification après achat
vivant sur `LeadAssignment.followupStatus` ; LeadAssignment pivot avec snapshot
prix et expiresAt, Wallet en `Int` (centimes) + WalletTransaction log immuable,
AuditLog sur les actions admin métier (pros, leads, wallet, prix, configuration).

Le modèle de données fait foi dans [`prisma/schema.prisma`](prisma/schema.prisma),
commenté champ par champ (sens des enums, sentinelles, colonnes réservées).

---

## Conventions code

- TypeScript strict, zéro `any` / `as any` douteux
- Result type pattern sur les Server Actions : `{ success: true; data } | { success: false; code; message }`
  (les actions du profil pro renvoient la variante `{ ok }`)
- `requireProSession()` / `requireAdminSession()` au début de chaque action sensible
- Tous les montants en `Int` représentant des centimes (jamais Float)
- Wallet : transaction `Serializable` + `SELECT ... FOR UPDATE` sur tout
  mouvement, débit comme crédit (seule exception : la recharge Stripe, qui
  utilise un `increment` SQL atomique)
- Transactions `Serializable` toujours via `runSerializable()`, qui rejoue
  les échecs de sérialisation (`P2034`)
- Webhook Stripe : signature vérifiée + body raw + idempotence par
  `stripeEventId @unique` + crédit conditionné à `payment_status === "paid"`
- Conventional commits (`feat:`, `fix:`, `refactor:`, etc.)

Détail complet : [`docs/conventions.md`](docs/conventions.md).

---

## Documentation

- [`docs/conventions.md`](docs/conventions.md) — Conventions de code détaillées
- [`prisma/schema.prisma`](prisma/schema.prisma) — Modèle de données, commenté champ par champ

---

## Limitations connues

- **Pas de compte client** — le particulier ne se connecte pas ; il laisse ses
  coordonnées dans la demande.
- **B2B / Copropriétés** — section de la landing affichée « en préparation »,
  sans fonctionnalité derrière.
- **RGPD utilisateur** — droits d'accès et d'effacement traités manuellement,
  sans endpoint dédié.
- **Cookies** — uniquement des cookies essentiels (auth, CSRF, Stripe
  Checkout) : pas de CMP.
- **Crons Vercel** — `vercel.json` configure 2 crons (`process-leads` toutes
  les 15 min, `check-no-match-leads` chaque jour à 9 h UTC). En dev local :
  déclenchement manuel via `curl -H "Authorization: Bearer $CRON_SECRET"`.
- **Tests** — Vitest sur la logique métier pure ; pas de tests e2e.

---

## Licence

Repo public à des fins de portfolio dev — utilisation, reproduction ou
réutilisation du code soumise à autorisation préalable.

---

## Contact

- Support produit : `contact@devisrapide.be`
- Dev (questions techniques code) : voir profil GitHub `@Namirop`
