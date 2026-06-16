# DevisRapide — Contexte projet pour Claude Code

> **Note Next.js 16 :** cette version a des breaking changes vs versions
> précédentes (APIs, conventions, file structure). Avant d'écrire du code
> Next-spécifique, consulter `node_modules/next/dist/docs/` ou la doc en
> ligne pour vérifier les conventions actuelles. Respecter les
> deprecation notices.

## Projet

Plateforme web de mise en relation particuliers/artisans (lead-gen). Modèle pay-per-lead avec wallet rechargeable côté pro.

## Acteurs

- **Client** : particulier, soumet une demande via formulaire (pas de compte authentifié au MVP).
- **Pro** : artisan, paie pour recevoir des leads. Wallet Stripe + auto-accept modes.
- **Admin** : valide les pros, configure les prix, gère wallet manuel et audit.

## Stack

- Next.js 16 (App Router) + TypeScript strict
- Tailwind v4 + shadcn/ui
- PostgreSQL (Neon) + Prisma 6 (volontaire, pas Prisma 7 — voir `docs/conventions.md`)
- Auth.js v5 + Prisma adapter
- Stripe (Checkout + Customer + Webhook)
- Resend + React Email
- web-push + VAPID + Service Worker
- Zod pour validation
- Upstash Ratelimit
- Sentry
- Vercel Pro + Vercel Cron

## Conventions critiques

### TypeScript

Strict mode. Zéro `any`, zéro `as any` douteux. Discriminated unions pour les variants.

### Next.js 16

- Server Components par défaut
- `'use client'` placé le plus bas possible dans l'arbre
- Pattern client island : Server wrapper qui fetch + Client minimal
- Server Actions pour mutations user-driven
- Route Handlers pour webhooks/cron/service worker

### Tailwind v4

- Design tokens dans `@theme inline`
- Utilities custom via `@utility`
- `@layer components` pour classes ponts
- Pas d'inline styles sauf dynamiques

### Argent

**Tous les montants en `Int` représentant des centimes.** Jamais Float ou Decimal. 10€ = `1000`.

### Sécurité

- Validation Zod côté serveur sur 100% des inputs
- Échappement HTML dans les emails
- Données sensibles client (nom/téléphone/adresse) jamais envoyées tant que `LeadAssignment.status !== 'ACCEPTED'`
- Webhook Stripe : signature vérifiée + body raw + idempotence par `stripePaymentIntentId @unique`
- Rate limiting Upstash sur `createLead`, login, push subscribe

### Wallet — atomicité obligatoire

Tout débit ou crédit du wallet passe par une transaction Prisma `Serializable` avec `FOR UPDATE` lock sur `ProProfile`. Voir `lib/wallet/debit.ts` et `lib/wallet/credit.ts`.

### Conventional commits

`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `perf:`, `a11y:`, `security:`. Scope quand pertinent : `feat(matching): ...`. Push quotidien.

### Format code

- 1 composant / fichier
- Dossier par feature, pas par type
- Pas de fichiers > 500 lignes
- Imports : externes → internes `@/` → types
- Commentaires uniquement sur décisions non évidentes
- Pas de `console.log` ni TODO/FIXME orphelins

## UI / Design

> Ce bloc ne contient PAS les règles de design (elles vivent dans le skill).
> Son seul job : forcer le déclenchement du skill, parce que CC sous-déclenche
> les skills sur les tâches qu'il croit pouvoir gérer seul — et le design en fait partie.
> Ne pas l'étoffer : un pointeur, pas un cours.

Dès que tu crées, modifies ou revois une interface (écran, composant, landing,
dashboard, formulaire, refonte), consulte le skill `anti-ai-design-patterns`
AVANT de finaliser. Ne traite pas le design comme une tâche faisable seul :
ce skill existe pour contrer ce réflexe.

Avant de considérer un écran « terminé », passe sa checklist de fin d'écran.

## Structure du repo

```
src/
├── app/
│   ├── (public)/        # Pages publiques + légales
│   ├── (pro)/           # Espace pro authentifié
│   ├── (admin)/         # Panel admin
│   └── api/             # Webhooks, cron, service worker endpoints
├── components/
│   ├── ui/              # shadcn/ui
│   └── [feature]/       # Composants par feature
├── lib/                 # Métier réutilisable, AUCUN React
│   ├── matching/
│   ├── wallet/
│   ├── geo/
│   ├── audit/
│   └── email/
├── server/
│   ├── actions/         # Server Actions (entry points)
│   └── queries/         # Queries Prisma réutilisables
├── schemas/             # Schémas Zod
├── types/
└── proxy.ts

prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

## Modèle de données — résumé

3 niveaux de catalogue : `Universe` → `Category` → `SubCategory`. Pricing au niveau Category (défaut), override possible au niveau SubCategory. Pros s'inscrivent au niveau Category.

Lead : status workflow `PENDING_MATCH → ASSIGNED → ACCEPTED → COMPLETED` (avec `EXPIRED`/`CANCELLED` possibles). Snapshot prix à la création.

LeadAssignment : table de jointure Lead↔Pro avec status, priceCents (snapshot), expiresAt (timeout 2h par défaut).

Wallet : `WalletTransaction` log immuable. `walletBalanceCents` mis à jour en transaction.

AuditLog : toute action admin (validation pro, prix, crédit/débit manuel) tracée systématiquement.

AppConfig : key-value pour paramètres modifiables par admin sans redéploiement.

Détails complets dans `docs/architecture.md`.

## Workflow de session avec Claude Code

Pour chaque tâche structurante, suivre le pattern :

1. **Audit** : lire le code existant pertinent + comprendre l'état actuel
2. **Plan** : présenter un plan d'action structuré (étapes, fichiers à modifier, commits prévus)
3. **Validation** : attendre validation explicite avant d'implémenter
4. **Implémentation** : coder étape par étape, commit par étape
5. **Récap** : présenter fichiers modifiés, divergences avec le plan, build/lint OK

**Stop & ask** sur les décisions non triviales. Mieux vaut une question de plus que du code à refaire.

## Décisions déjà tranchées (ne pas redébattre)

- Auth : Auth.js v5
- BDD : Neon Postgres
- Géo : Float lat/lng + fonction SQL `haversine_km` custom (pas PostGIS)
- Real-time : polling SWR 30s (pas SSE/WebSocket)
- Tests : Vitest sur le métier critique pur (pricing, géo, stats) ; pas de E2E/intégration au MVP, le reste en manuel documenté
- Sous-domaines : non, sous-chemins
- URLs : français
- Soft delete : `User` et `Lead` uniquement

## Documentation projet

- `docs/architecture.md` : doc de référence complet
- `docs/conventions.md` : conventions de code détaillées
- `docs/design-system.md` : tokens, composants, patterns visuels

## Sprints

> Planning initial du MVP — livré (le produit tourne en prod). Conservé pour
> contexte ; le travail courant se fait hors de ce tableau.

| Sprint | Jours   | Focus                                    |
| ------ | ------- | ---------------------------------------- |
| S0     | J1      | Foundation (Prisma, Auth, layouts, seed) |
| S1     | J2-J3   | Création lead client                     |
| S2     | J4-J6   | Matching + dashboard pro lecture         |
| S3     | J7-J8   | Wallet Stripe + accept/refuse            |
| S4     | J9-J10  | Panel admin + cron                       |
| S5     | J11-J13 | PWA + Push + emails + polish             |
| S6     | J14-J15 | Prod + retours client                    |
