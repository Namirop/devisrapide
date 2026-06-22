# Conventions de code — DevisRapide

Conventions de code du projet DevisRapide.

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

## Server Actions — Result type pattern

Toutes les Server Actions retournent un **discriminated union** Result :

```ts
type ProLifecycleResult =
  | { success: true; /* data optionnelle */ }
  | {
      success: false;
      code: "INVALID_INPUT" | "PRO_NOT_FOUND" | "FORBIDDEN" | "INTERNAL";
      message: string;
    };
```

Convention :
- **`success: boolean`** (pas `ok` ni `ok: true`). Discriminant uniforme.
- **`code`** : union de string literals stable cote client. Pas de mapping i18n
  dans l'action — le client tranche le wording si besoin.
- **`message`** : message FR pret a afficher (UX direct, `toast.error(result.message)`).
- **Pas de `throw`** depuis l'action vers le client — toujours retourner un
  Result. Les `throw` internes (ActionError, Prisma errors) sont catched
  dans l'action et mappes en `Result { success: false, code }`.

Codes communs reutilises :
- `INVALID_INPUT` — Zod parse failed
- `UNAUTHORIZED` / `FORBIDDEN` — `requireProSession` / `requireAdminSession` throw
- `NOT_FOUND` — entite cible introuvable
- `RATE_LIMITED` — Upstash Ratelimit dépassé
- `INTERNAL` — fallback pour erreurs non identifiees (Prisma down, etc.)
- Codes specifiques metier : `PRO_NOT_FOUND`, `EMAIL_CONFLICT`, `VAT_CONFLICT`,
  `INSUFFICIENT_FUNDS`, `LEAD_EXPIRED`, `ALREADY_ASSIGNED`, `LEAD_FULL`, etc.

Cote client :

```ts
const result = await myAction(input);
if (!result.success) {
  toast.error(result.message); // affichage direct
  // Switch sur result.code si besoin d'un comportement specifique
  if (result.code === "INSUFFICIENT_FUNDS") {
    router.push("/dashboard/wallet?tab=packs");
  }
  return;
}
// result.success est `true` ici, TS narrowing automatique sur la data.
```

## Audit log

Toutes les actions admin sensibles sont wrappees par `withAuditLog` :

```ts
return await withAuditLog<MyResult>(
  {
    action: "PRO_VALIDATED", // enum AuditAction
    actorId: adminUserId,
    target: { type: "ProProfile", id: proProfileId },
    inputSummary: { proProfileId },
    resultSummary: (r) => ({ success: r.success, code: r.success ? null : r.code }),
  },
  async () => {
    // ... business logic, peut return Result ou throw
  },
);
```

Voir `src/lib/audit/log.ts` pour le helper. Statut `SUCCESS` si fn() returne,
`FAILURE` si fn() throw (puis re-throw). Le log est wrappe en try/catch
local — un échec d'INSERT AuditLog ne crashe jamais l'action métier.

## Tailwind v4

- Design tokens dans `@theme inline` (`globals.css`).
- Utilities custom via `@utility` ou classe globale sous `@layer base` quand pertinent (ex: `.bg-grid-pattern` pour le pattern grille de la landing).
- `@layer components` pour les classes ponts reutilisables.
- Pas d'inline styles sauf valeurs dynamiques (positionnement calcule, etc.).

## Design system

Palette, typo, composants UI, tokens centralises dans `src/app/globals.css` (`@theme inline` + `:root`).

- **Pas de nouvelle couleur** hors palette validee sans review design. Pas de gradient flashy.
- **Pas de display font additionnelle** (Inter en body, Plus Jakarta Sans / Bricolage exposees via vars CSS pour usages dedies).

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

Tout debit du wallet passe par une transaction Prisma `Serializable` avec `SELECT ... FOR UPDATE` sur `ProProfile` (`src/lib/wallet/debit.ts`). Les credits (recharge Stripe, ajustement admin) passent par une transaction Prisma sans lock explicite.

## Git

- Conventional commits : `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `perf:`, `a11y:`, `security:`.
- Scope quand pertinent : `feat(matching): ...`, `fix(wallet): ...`.
- Commits petits, atomiques. Push quotidien.
- Branche `main` protegee. Travail sur `feat/*`. PR vers `main`, merge apres review.

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
- Sous-chemins, pas de sous-domaines (`/dashboard/...`, `/admin/...`).
- Slugs de catalogue en `kebab-case`.

## Tests

Vitest sur la logique métier pure (pricing, geo, stats). Le reste :
- TypeScript strict (compile time)
- Zod (runtime input)
- Sentry en prod (`@sentry/nextjs` server + client + edge)

## Versions verrouillees

- **Next.js 16** : le rename `middleware.ts` -> `proxy.ts` est effectif (meme API, meme role).
- **React 19.2** : embarque par Next 16. Server Components par defaut, `'use client'` minimal et place le plus bas possible dans l'arbre.
- **Tailwind v4** : tokens dans `@theme inline`, classes globales sous `@layer base`.
- **Prisma 6** : verrouille en `^6` volontairement. Prisma 7 introduit des breaking changes (`prisma.config.ts` obligatoire, datasource `url` retire du schema, adapter requis pour migrations) sans valeur ajoutee pour ce projet.
- **framer-motion 12.x** : utilise sur le wizard (transitions step) et le composant `Reveal` (fade-up au scroll). `useReducedMotion()` respecte par defaut.
- **@phosphor-icons/react** : librairie d'icones du projet (named imports). `lucide-react` n'est present que via les primitifs shadcn/ui.

