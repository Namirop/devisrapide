On attaque Sprint 5c : Polish produit final — Sentry monitoring + Turnstile anti-bot + Cookies banner + Lighthouse perf + Vitest tests unitaires + Headers sécurité.

C'est le dernier sprint avant PWA (5.5) puis launch (6). Objectif : production-ready, sécurisé, observable.

## Contexte

Branche actuelle : dev (à jour avec Sprint 5b refonte mergé).
Crée une nouvelle branche feat/sprint5c-polish depuis dev.

Toute la dette technique critique a été traitée en Sprint 5b. Ce sprint ajoute la couche production qui manque.

## Hiérarchie d'autorité

1. Backend Sprint 2a + Stripe Sprint 3 + actions admin Sprint 5b = INTOUCHABLES. On observe, on sécurise, on n'altère pas la logique.
2. Conventions code docs/conventions.md = strict respect (mises à jour récemment en Sprint 5b)
3. Variables d'environnement = ajout dans .env.local.example obligatoire avec instructions

## Mission

1. **Sentry** — Monitoring d'erreurs côté serveur + client (intégration native Next.js, pas embed dans admin Kamel)
2. **Turnstile** — Captcha Cloudflare invisible sur 3 formulaires (wizard particulier, inscription pro, connexion)
3. **Cookies banner** — Bandeau minimal "cookies essentiels uniquement"
4. **Lighthouse perf** — Optims SEO + performance + accessibility sur la landing publique
5. **Vitest tests unitaires** — Setup + 10-15 tests sur logique métier critique (pricing, wallet, géolocalisation)
6. **Headers sécurité** — CSP + X-Frame-Options + standards
7. **Stripe webhook validation montant** — Vérifier que le montant reçu correspond bien à un pack autorisé (anti-manipulation)

## Audit attendu

1. Vérifier les variables d'environnement existantes : place où ajouter SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN, TURNSTILE_SITE_KEY (public), TURNSTILE_SECRET_KEY
2. Identifier les composants Client des formulaires concernés (LeadFormWizard, ProSignupWizard, login form)
3. Vérifier le fichier `next.config.js` ou `next.config.ts` actuel : où ajouter les headers de sécurité
4. Identifier les fonctions métier candidates aux tests unitaires :
   - `src/lib/pricing.ts` (computeLeadBasePrice, computeAssignmentPrice avec modulateurs urgency)
   - `src/lib/wallet/debit.ts` (debitWalletForLead, edge cases solde insuffisant)
   - `src/lib/geo/be-postal.ts` (validateAndResolvePostalCode)
   - `src/lib/finance.ts` (calculateTTC, formatAmountBE, normalizeVatBE, vatBeRegex)
   - `src/lib/stats.ts` (computeDeltaPercent edge cases)
5. Vérifier le webhook Stripe Sprint 3 : la validation montant côté serveur est-elle déjà faite ? Si oui, OK. Si non, on l'ajoute.

## Spécifications détaillées

### Bloc 1 — Sentry

**Installation et setup :**

- `pnpm add @sentry/nextjs`
- Sentry CLI wizard auto si possible : `pnpm dlx @sentry/wizard@latest -i nextjs` (génère les fichiers de config)
- Si wizard ne marche pas en non-interactif, créer manuellement les fichiers :
  - `sentry.client.config.ts` (capture côté browser)
  - `sentry.server.config.ts` (capture côté Server Components + Server Actions)
  - `sentry.edge.config.ts` (capture côté middleware Edge)
  - `instrumentation.ts` (boot Sentry au startup Next)
  - Modifier `next.config.ts` pour wrap avec `withSentryConfig`

**Configuration Sentry :**

- DSN via env var `NEXT_PUBLIC_SENTRY_DSN` (client) + `SENTRY_DSN` (server, peut être identique)
- `tracesSampleRate: 0.1` (10% des transactions pour éviter de cramer le quota free tier)
- `environment: process.env.NODE_ENV` (separation dev/prod)
- `enabled: process.env.NODE_ENV === 'production'` (pas de capture en dev local pour pas polluer)
- `release: process.env.VERCEL_GIT_COMMIT_SHA` (link entre erreur et commit)

**Captures custom à ajouter :**

- Dans `withAuditLog` helper (Sprint 5b) : si l'action throw, après le log AuditLog FAILURE, call `Sentry.captureException(err, { tags: { action, actorId } })`
- Dans webhook Stripe handler : si signature invalide ou idempotence failed, `Sentry.captureMessage` info level
- Dans cron `process-leads` : si un lead throw dans le try/catch par lead, capture chaque erreur avec contexte (leadId, palier)
- Dans `createLead.matchLead` swallow : remplacer le console.error orphelin par `Sentry.captureException`

**Données sensibles à scrubber :**

- Configurer `beforeSend` pour scrubber les PII (email, phone, password dans les payloads)
- Pattern : si event.request.body contient ces champs, les remplacer par `[REDACTED]`

**Dashboard externe :**

Pas d'intégration UI dans `/admin`. L'admin Kamel ne voit RIEN de Sentry. Le dashboard se consulte sur sentry.io.

Documenter dans README + docs/manual-testing.md : "Pour consulter les erreurs prod, dashboard Sentry à l'URL X (compte Romain)".

### Bloc 2 — Turnstile

**Setup :**

- `pnpm add react-turnstile` (wrapper React officiel) ou utiliser le widget HTML natif Cloudflare via injection script
- Recommandation : `react-turnstile` simple à utiliser

**Variables d'env :**
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (publique, injectée côté client)
- `TURNSTILE_SECRET_KEY` (côté serveur, pour vérifier le token)

**Helper de vérification :**

Créer `src/lib/turnstile/verify.ts` :

```typescript
export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<{ success: boolean; errorCodes?: string[] }> {
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: remoteIp,
    }),
  });
  const data = await response.json();
  return { success: data.success === true, errorCodes: data["error-codes"] };
}
```

**Intégration sur 3 formulaires :**

**a) Wizard `/demande` :**
- Composant `<Turnstile siteKey={...} onSuccess={(token) => setTurnstileToken(token)} />` ajouté à l'étape finale (Step 6 Contact)
- Le token est inclus dans les données envoyées à `createLead` Server Action
- Côté Server Action `createLead` : vérifier le token via verifyTurnstileToken AVANT toute autre logique. Si invalid → return Result error code "TURNSTILE_FAILED"
- Côté UI : si erreur Turnstile, message "Vérification de sécurité échouée, veuillez réessayer"

**b) Inscription pro `/inscription-pro` :**
- Pareil sur la dernière étape du wizard inscription
- Vérification côté Server Action submitProRegistration (ou équivalent)

**c) Connexion `/connexion` :**
- Pareil mais ATTENTION : Auth.js authorize est appelé via NextAuth.js, pas via une Server Action standard
- Stratégie : ajouter Turnstile au formulaire de login (côté Client), inclure le token dans `credentials` lors du signIn
- Côté Auth.js authorize callback : vérifier le token Turnstile EN PREMIER avant bcrypt compare
- Si token invalide → return null (Auth.js renverra CredentialsSignin générique côté client)

**Comportement mobile :**

- Turnstile fonctionne nativement responsive, pas d'adaptation nécessaire
- Vérifier que sur mobile le widget ne casse pas le layout du formulaire

### Bloc 3 — Cookies banner (option A minimal)

**Composant :**

Créer `src/components/cookies/CookiesBanner.tsx` (Client Component) :

- Affiché en bas d'écran (position fixed bottom)
- Background `bg-[#0f1e3d]` (cohérent palette dark navy)
- Texte blanc court : "Ce site utilise uniquement des cookies essentiels au fonctionnement (authentification, sécurité). Aucun cookie de tracking ou de publicité."
- Bouton accent orange "J'ai compris"
- Au clic : enregistre `localStorage.setItem('cookies-acknowledged', '1')` + cache la bannière
- Au mount : vérifie le localStorage, si déjà acknowledged → ne pas afficher
- Apparition différée : 800ms après le mount pour ne pas flash au chargement

**Intégration :**

Dans `src/app/layout.tsx` (root layout), ajouter `<CookiesBanner />` au-dessus du `</body>` (last DOM element). Visible sur toutes les pages.

**Comportement :**

- Pas de blocage de fonctionnalités (Auth.js cookies "strictement nécessaires")
- Une seule action : "J'ai compris" + close
- Lien discret "En savoir plus" → `/cookies` (page existante Sprint footer)

### Bloc 4 — Lighthouse perf

**Optimisations à appliquer sur landing publique `/` et `/pros` :**

**a) Images :**
- Toutes les `<img>` restantes → `<Image>` next/image avec `priority` sur LCP, `loading="lazy"` sur le reste
- Vérifier formats : préférer WebP/AVIF auto-générés par next/image
- Si Hero a un `<picture>` avec sources fallback, le garder

**b) Fonts :**
- Bricolage Grotesque + Plus Jakarta Sans + Inter : vérifier `display: swap`
- Preload des fonts critiques (Inter latin subset pour le body)

**c) Preconnect critique :**
- Dans `<head>` du root layout : `<link rel="preconnect" href="https://challenges.cloudflare.com">` (pour Turnstile)
- `<link rel="preconnect" href="https://js.stripe.com">` sur pages wallet (Stripe)
- `<link rel="dns-prefetch" href="https://browser.sentry-cdn.com">` (Sentry)

**d) Lazy loading sections below-the-fold :**
- Sur la landing `/`, les sections après le Hero peuvent être lazy-rendered via React.lazy ou Next.js dynamic imports
- Cible : Section témoignages (Testimonials), section B2B placeholder, section bottom CTA
- Si l'overhead du code splitting est minime, OK. Sinon laisser SSR direct.

**e) SEO metadata :**
- Vérifier que chaque page publique a `generateMetadata` avec :
  - `title` unique et descriptif
  - `description` 150-160 chars
  - `openGraph` (title, description, images, locale)
  - `twitter` card
  - `alternates.canonical`
- Cible pages : /, /pros, /demande, /demande/confirmation, /inscription-pro, /connexion, pages légales, /404, /500

**f) Accessibilité :**
- Vérifier que tous les `<img>` ont un `alt`
- Vérifier hiérarchie headings (un seul h1 par page, h2 puis h3 cohérent)
- Vérifier contrast ratios (Bricolage Grotesque sur bg-slate-50 ?)
- Vérifier focus rings visibles sur tous les éléments interactifs (button, input, link)
- Vérifier aria-labels sur boutons icon-only (genre bouton hamburger mobile, bouton close modal)

**g) Cible Lighthouse mobile (landing publique `/`) :**
- Performance : ≥ 85
- Accessibility : ≥ 95
- Best Practices : ≥ 95
- SEO : ≥ 95

Si Performance < 85 après optims, identifier les blockers et documenter dans v2-roadmap.md (genre framer-motion bundle, etc.).

### Bloc 5 — Vitest tests unitaires

**Setup :**

- `pnpm add -D vitest @vitest/ui happy-dom`
- Config `vitest.config.ts` minimal :
  - environment: 'node' pour tests purs
  - globals: true
- Ajouter scripts package.json :
  - `"test": "vitest run"`
  - `"test:watch": "vitest"`
  - `"test:ui": "vitest --ui"`

**Tests à écrire (10-15 tests) :**

**a) `src/lib/pricing.test.ts` :**
- computeLeadBasePrice retourne le bon prix pour Toiture FLEXIBLE (60€ × 0.9)
- computeLeadBasePrice applique modulateur URGENT (1.3)
- computeLeadBasePrice cas SOS Dépannage (35€ base × 1.5 = 52.50€)
- computeAssignmentPrice multiplie par 2.5 si isExclusive

**b) `src/lib/wallet/debit.test.ts` :**
- debitWalletForLead succès cas nominal (mock prisma)
- debitWalletForLead throw WalletInsufficientFundsError si balance < amount
- (Test plus complexe car nécessite mock Prisma transaction — laisser à Claude Code de décider de la profondeur)

**c) `src/lib/geo/be-postal.test.ts` :**
- validateAndResolvePostalCode("1000") retourne Bruxelles + lat/lng
- validateAndResolvePostalCode("00000") retourne { valid: false }
- validateAndResolvePostalCode("9999") retourne { valid: false } (code postal non belge)

**d) `src/lib/finance.test.ts` :**
- calculateTTC(100) = 121 (TVA BE 21%)
- formatAmountBE(1234.56) = "1 234,56 €"
- normalizeVatBE("BE 0123 456 789") = "BE0123456789"
- vatBeRegex valide BE0123456789, rejette FR12345678901

**e) `src/lib/stats.test.ts` :**
- computeDeltaPercent(0, 5) = "Nouveau" (pas Infinity)
- computeDeltaPercent(0, 0) = null ou "—"
- computeDeltaPercent(100, 120) = 20%
- computeDeltaPercent(100, 80) = -20%

**Lancement :**
- `pnpm test` doit passer tous les tests verts
- Si un test échoue, fix la fonction OU le test selon ce qui est buggué

**Pas de coverage report V1.** Juste les tests qui passent.

### Bloc 6 — Headers sécurité

**Configuration `next.config.ts` :**

Ajouter `headers()` async function qui retourne :

```typescript
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://js.stripe.com https://browser.sentry-cdn.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: blob: https:",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://api.stripe.com https://challenges.cloudflare.com https://*.ingest.sentry.io https://*.sentry.io",
            "frame-src 'self' https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
          ].join("; "),
        },
      ],
    },
  ];
}
```

Tester en local : ouvrir la console browser, vérifier qu'aucune violation CSP ne casse les fonctionnalités (Stripe Checkout, Turnstile, Sentry).

**Important :** `'unsafe-eval'` et `'unsafe-inline'` dans script-src sont nécessaires pour Next.js. À retirer V2 si on configure nonce-based CSP (complexe).

### Bloc 7 — Validation montant Stripe webhook

**Vérification dans `src/app/api/stripe/webhook/route.ts` :**

Dans le handler `checkout.session.completed`, AVANT de créditer le wallet :

1. Récupérer le pack depuis AppConfig.WALLET_PACKS via `packId` du metadata
2. Vérifier que `creditAmountCents` du metadata correspond EXACTEMENT à `pack.creditEur * 100` du pack canonique en BDD
3. Si discordance → log Sentry warning + ne PAS créditer + return 200 (le webhook est traité mais sans action)

Cela protège contre :
- Manipulation client du metadata (peu probable car Stripe contrôle)
- Pack supprimé entre Checkout creation et webhook arrival (cas rare)

Si la vérif existe déjà Sprint 3, l'auditer et la documenter. Sinon, ajouter.

## Hors périmètre absolu

- Pas de Playwright E2E (skip, à la demande de Romain)
- Pas d'intégration Sentry UI dans dashboard admin Kamel (Romain consulte sentry.io)
- Pas de Stripe Radar config code (action manuelle dans dashboard Stripe par Romain)
- Pas de 2FA admin (V2)
- Pas de WAF Cloudflare (V2)
- Pas de CMP cookies banner complète (V2 si analytics ajoutées)
- Pas de Pino logger structuré (V2)
- Pas de tests E2E (V2)
- Pas de touche aux Server Actions existantes au-delà de l'ajout Turnstile + Sentry captures
- Pas de migration Prisma

## Conventions code strictes

- TypeScript strict, zéro any
- Tests Vitest passent tous verts
- pnpm build + lint + tsc OK après chaque commit
- Conventional Commits
- Variables d'env documentées dans .env.local.example avec instructions de récupération
- Composants Client minimum (Turnstile, CookiesBanner)
- Imports Sentry uniquement dans config files + helpers, pas partout

## Plan attendu

Après audit, propose un plan en commits atomiques. Estimation ~15-20 commits.

Ordre suggéré (à adapter selon audit) :

PHASE 1 — Sentry (4 commits)
1. chore(deps): add @sentry/nextjs
2. feat(sentry): config files + instrumentation.ts + next.config wrap
3. feat(sentry): wire captureException in withAuditLog + cron + webhook + matchLead
4. feat(sentry): beforeSend PII scrubbing

PHASE 2 — Turnstile (4 commits)
5. chore(deps): add react-turnstile + env vars
6. feat(turnstile): verifyTurnstileToken helper
7. feat(turnstile): wire on /demande wizard (Step 6 + createLead Server Action)
8. feat(turnstile): wire on /inscription-pro + /connexion

PHASE 3 — Cookies banner (1 commit)
9. feat(cookies): CookiesBanner component + integration in root layout

PHASE 4 — Headers sécurité + Stripe (2 commits)
10. feat(security): CSP + standard headers in next.config
11. fix(stripe): validate amount against canonical pack in webhook handler

PHASE 5 — Lighthouse perf (3-4 commits)
12. perf(images): replace remaining <img> with next/image + preload critical fonts
13. perf(metadata): ensure generateMetadata + OpenGraph on all public pages
14. perf(a11y): focus rings + aria-labels audit + alt text completeness
15. perf(preconnect): preconnect Cloudflare + Stripe + Sentry CDN

PHASE 6 — Vitest tests (3 commits)
16. chore(test): vitest setup + scripts package.json
17. test(pricing+wallet+geo): 10-12 unit tests on core logic
18. test(finance+stats): 5-6 unit tests on utility functions

PHASE 7 — Docs (2 commits)
19. docs: update README with Sentry/Turnstile setup + .env.local.example completeness
20. docs: update v2-roadmap with deferred items + manual-testing for Sprint 5c

Ajuste selon audit.

## Méthode

Audit → Plan → Validation → Implémentation commit par commit → Récap final avec :
- git log --oneline des commits
- Confirmation que pnpm test passe tous verts
- pnpm lint + tsc + build OK
- Test manuel : soumettre wizard /demande sans Turnstile token (forcé via DevTools) → Server Action rejette
- Test manuel : Sentry capture une erreur volontaire (throw temporaire) → dashboard sentry.io reçoit l'event
- Lighthouse manuel sur landing publique → résultats des 4 scores
- Validation des headers via curl ou DevTools Network tab

## Stop & ask si

- Sentry wizard interactif requis (signale, je m'en occupe en parallèle)
- Variables d'env Turnstile/Sentry manquantes côté Romain (signale, je crée les comptes et fournis)
- CSP casse une fonctionnalité (Stripe, Auth.js) → signale, on relaxe la policy
- Vitest setup en conflit avec config Next 16 (signale)
- Le bundle Sentry impacte trop le LCP mobile (signale, on désactive en dev OU on configure tunneling)
- Turnstile site key non fourni → tu peux mocker la vérif en dev (return success: true si NODE_ENV === 'development' + token === 'mock')

## Critère de succès

- Sentry capture les erreurs serveur ET client (testé via throw volontaire)
- Turnstile valide les 3 formulaires (wizard, signup pro, login)
- Cookies banner affiché au premier visit, mémorisé après "J'ai compris"
- Headers sécurité présents (DevTools Network → headers du document HTML)
- Stripe webhook valide le montant contre AppConfig
- Tests Vitest tous verts (pnpm test exit 0)
- Lighthouse landing publique : Performance ≥ 85 mobile, autres ≥ 95
- Build + lint + tsc OK
- Conventional Commits propres

Commence par l'audit. Pas une ligne de code avant validation du plan.
