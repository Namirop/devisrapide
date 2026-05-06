# DevisRapide

Plateforme de mise en relation particuliers / artisans (lead-gen pay-per-lead avec wallet rechargeable).

## Stack

- **Next.js 16** (App Router) + **TypeScript** strict
- **Tailwind v4** + **shadcn/ui**
- **PostgreSQL** (Neon) + **Prisma**
- **Auth.js v5** + Prisma adapter
- **Stripe** (Checkout + Webhook) — Sprint 3
- **Resend** + React Email — Sprint 5
- **web-push** + VAPID + Service Worker — Sprint 5
- **Upstash Ratelimit** — Sprint 1+
- **Sentry** — Sprint 5+
- **Vercel Pro** + **Vercel Cron**

## Prerequis

- Node 20+
- pnpm 10+
- Acces a un projet Neon (URL Postgres)

## Demarrage

```bash
# 1. Cloner et installer
pnpm install

# 2. Copier l'exemple d'env et remplir les variables minimales
cp .env.local.example .env.local
# Renseigner DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD

# 3. Appliquer les migrations + seeder la base
pnpm db:deploy
pnpm db:seed

# 4. Lancer le serveur de dev
pnpm dev
```

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Serveur de developpement (Turbopack) |
| `pnpm build` | Build prod (applique les migrations puis compile) |
| `pnpm start` | Lance le build prod |
| `pnpm lint` | ESLint |
| `pnpm db:migrate` | `prisma migrate dev` (creation/application de migration en dev) |
| `pnpm db:deploy` | `prisma migrate deploy` (application en prod / CI) |
| `pnpm db:seed` | Seed initial (univers, categories, AppConfig, user admin) |
| `pnpm db:studio` | Prisma Studio (UI BDD) |
| `pnpm db:generate` | Regenere le client Prisma |

## Structure

Voir `docs/architecture.md` (section 5.1) pour la structure de repo complete et `CLAUDE.md` pour les conventions critiques.

## Documentation

- `CLAUDE.md` — Conventions critiques (a lire avant tout travail)
- `docs/architecture.md` — Document de reference complet
- `docs/conventions.md` — Conventions de code detaillees
