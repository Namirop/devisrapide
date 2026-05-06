# Conventions de code — DevisRapide

Document evolutif, enrichi a chaque sprint. Voir aussi `CLAUDE.md` (resume) et `docs/architecture.md` (reference).

## TypeScript

- `strict: true`. Zero `any`, zero `as any` douteux.
- Discriminated unions pour les variants (status, role, etc.).
- Type guards quand pertinent.
- Inference privilegiee, types explicites uniquement aux frontieres (params Server Actions, retours d'API).
- Types partages exportes depuis fichier dedie (`src/types/`).

## React / Next.js

- Server Components par defaut.
- `'use client'` uniquement quand necessaire (state, effects, browser API), place le plus bas possible dans l'arbre.
- Pattern client island : Server wrapper qui fetch les donnees + Client minimal pour l'interactivite.
- `generateStaticParams` + `generateMetadata` sur routes dynamiques quand applicable.
- Server Actions pour les mutations user-driven, Route Handlers pour webhooks/cron/SW.

## Tailwind v4

- Design tokens dans `@theme inline` (`globals.css`).
- Utilities custom via `@utility`.
- `@layer components` pour les classes ponts reutilisables.
- Pas d'inline styles sauf valeurs dynamiques (positionnement calcule, etc.).

## Validation et securite

- **Zod cote serveur sur 100% des inputs** : Server Actions, Route Handlers, params URL. Schemas dans `src/schemas/`.
- Echappement HTML systematique dans les emails.
- Donnees client sensibles (nom, telephone, adresse) jamais envoyees tant que `LeadAssignment.status !== 'ACCEPTED'`.
- Webhook Stripe : signature verifiee, body raw, idempotence par `stripePaymentIntentId @unique`.
- Rate limiting Upstash sur `createLead`, login, push subscribe.
- `.env.local` jamais commit. Pas de secrets hardcodes.

## Argent

**Tous les montants en `Int` representant des centimes.** Jamais Float ni Decimal. 10€ = `1000`.

## Wallet — atomicite

Tout debit ou credit du wallet passe par une transaction Prisma `Serializable` avec `FOR UPDATE` lock sur `ProProfile`. Voir `lib/wallet/debit.ts` et `lib/wallet/credit.ts` une fois implementes (Sprint 3).

## Git

- Conventional commits : `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `perf:`, `a11y:`, `security:`.
- Scope quand pertinent : `feat(matching): ...`, `fix(wallet): ...`.
- Commits petits, atomiques. Push quotidien.
- Branche `main` protegee. Travail sur `dev` ou `feat/*`. PR vers `dev`, merge manuel par Romain.

## Format du code

- 1 composant par fichier.
- Dossier par feature, pas par type (`components/lead-form/`, pas `components/forms/`).
- Pas de fichiers > 500 lignes.
- Imports : externes -> internes `@/` -> types.
- Pas de `console.log` en prod, pas de TODO/FIXME orphelins, pas de dead code.
- Commentaires uniquement sur decisions techniques non evidentes.
- Noms explicites, pas d'abreviations cryptiques.

## Conventions URLs

- URLs en francais (`/demande`, `/connexion`, `/inscription-pro`).
- Sous-chemins, pas de sous-domaines (`/pro/...`, `/admin/...`).
- Slugs de catalogue en `kebab-case`.

## Tests

Pas de tests automatises au MVP. A la place :
- TypeScript strict (compile time)
- Zod (runtime input)
- Tests manuels documentes (`docs/manual-testing.md`)
- Sentry post-launch

## Versions verrouillees

- **Next.js 16** : stable courant (mai 2026), shipped par `create-next-app`. Le rename `middleware.ts` -> `proxy.ts` est effectif (meme API, meme role).
- **React 19.2** : embarque par Next 16.
- **Prisma 6** : verrouille en `^6` volontairement. Prisma 7 introduit des breaking changes (`prisma.config.ts` obligatoire, datasource `url` retire du schema, adapter requis pour migrations) sans valeur ajoutee pour ce projet. A reevaluer en V2 si besoin de features Prisma 7.

## TODO Sprint 1

- Installer le composant **Form** de shadcn (non expose par le style `base-nova` au S0). Au moment de l'installer, ajouter aussi `react-hook-form` et `@hookform/resolvers/zod` pour le formulaire client multi-step.
