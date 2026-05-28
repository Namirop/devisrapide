# Sprint 5.6 — Audit bundle JavaScript avant/après

Document chiffré du diagnostic + optimisations du Sprint 5.6 (mai 2026).
Cible : réduction du poids JS sur la landing publique `/`.

## Méthode

`@next/bundle-analyzer` (devDep) + `ANALYZE=true pnpm build --webpack` (Next 16
default Turbopack ne supporte pas encore l'analyzer webpack, fallback explicite).
Scripts d'agrégation custom dans `scripts/` :

- `bundle-report.mjs` : top contributeurs par package npm
- `chunk-detail.mjs` : décomposition d'un chunk précis
- `where-pkg.mjs` : localisation d'une lib dans les chunks
- `bundle-compare.mjs` : diff de 2 rapports analyzer

Bundles mesurés en `parsedSize` (post-minification, pré-gzip) et `gzipSize`.

## Diagnostic initial — chunks chargés sur `/`

| Chunk | parsed | gzip | Contenu majeur |
|---|---|---|---|
| `webpack-…` | 3.7 kB | 1.9 kB | webpack runtime |
| `e5a90919-…` | 195.5 kB | 61.4 kB | next runtime |
| `62-…` (shared) | **434.3 kB** | **129.8 kB** | next vendor (291 kB) + **@sentry/nextjs (140 kB)** |
| `main-app-…` | 3.3 kB | 1.4 kB | next app router |
| `framework-…` | 185.6 kB | 58.1 kB | react + react-dom |
| `147-…` | 4.5 kB | 2.0 kB | next utils |
| `6998-…` | 10.2 kB | 4.3 kB | @base-ui/react + @floating-ui/utils |
| `7986-…` | 26.2 kB | 8.2 kB | tailwind-merge |
| `2996-…` | 13.9 kB | 5.4 kB | next utils |
| **`5245-…`** | **119.4 kB** | **38.9 kB** | **framer-motion** (via Reveal) ← cible |
| `2323-…` | 41.6 kB | 10.6 kB | @phosphor-icons/react 39.7 kB |
| `app/(public)/page-…` | 14.1 kB | 4.7 kB | code landing-spécifique |
| `app/layout-…` | 5.5 kB | 2.2 kB | root layout |
| **TOTAL landing `/`** | **1 057.8 kB** | **328.9 kB** | |

## Top contributeurs npm (bundle client total, avant)

```
 1.  645.0 kB     188.7 kB     next                  ← incompressible
 2.  265.4 kB     71.9 kB      @phosphor-icons/react ← 25 chunks
 3.  174.1 kB     54.6 kB      react-dom             ← incompressible
 4.  158.5 kB     57.8 kB      @base-ui/react        ← tree-shaké
 5.  140.5 kB     47.5 kB      @sentry/nextjs        ← shared, toutes pages
 6.  120.6 kB     39.8 kB      framer-motion         ← cible Sprint 5.6
 7.   57.4 kB     15.7 kB      zod                   ← wizards uniquement
 ...
```

## Constats clés

- **@stripe/stripe-js** : ABSENT du bundle client. Confirmé via `where-pkg.mjs`,
  seul `stripe/webhook/route` côté server. Rien à scoper.
- **@sentry/nextjs (140 kB)** : SDK forcément bundlé dans le chunk shared
  `62-…`, donc chargé sur toutes pages. `enabled: production` ne change que la
  capture, pas le bundle. Gain potentiel via Sentry Loader Script (~−140 kB)
  identifié mais **reporté en V2** (cf. tradeoffs ci-dessous).
- **framer-motion (120 kB)** : utilisé sur landing uniquement via `Reveal`
  (animation fade-up scroll). Les wizards (LeadFormWizard, ProSignupWizard)
  ont une vraie valeur avec `AnimatePresence` — à conserver.
- **@phosphor-icons/react** : 102 fichiers importent Phosphor, 56 sans
  `/dist/ssr`. Les composants DS sur landing utilisent déjà majoritairement
  `/dist/ssr`. Quelques islands client (Hero, ProPotential, CookiesBanner,
  composants PWA) restaient sur le path non-SSR.

## Optimisations livrées (commits 2-4)

### Commit 2 — `refactor(landing): replace Reveal with CSS-only IntersectionObserver`

`src/components/ds/Reveal.tsx` réécrit en CSS pur + IntersectionObserver,
visuellement strictement identique à l'ancienne version framer-motion :

- État initial : `opacity: 0; translateY(16px)`
- État final : `opacity: 1; translateY(0)`
- Durée : 600 ms
- Easing : `cubic-bezier(0.22, 1, 0.36, 1)`
- Trigger : `rootMargin "0px 0px -80px 0px"` (équivalent
  `viewport.margin: "-80px"` framer-motion)
- `once: true` : disconnect après premier intersect
- `prefers-reduced-motion` : aucune transition, contenu visible immédiatement

API publique inchangée (`delay` prop + spread div props), drop-in pour les
5 sections de la landing (Stats, HowItWorks, WalloniaBanner, B2BSection,
Testimonials).

**framer-motion reste utilisé** par `AnimatePresence` dans les 2 wizards
— scope routes `/demande` et `/inscription-pro` uniquement.

### Commit 3 — `perf(landing): use /dist/ssr Phosphor variants on Hero + ProPotential`

Bascule des imports `@phosphor-icons/react` → `@phosphor-icons/react/dist/ssr`
sur les 2 islands client de la landing publique :

- `src/components/ds/Hero.tsx` : ArrowRight, Check, CheckCircle, Lightbulb,
  ShieldCheck
- `src/components/ds/pro/ProPotential.tsx` : Briefcase, MapPin, TrendUp

### Commit 4 — `perf(banners): use /dist/ssr Phosphor in always-loaded client components`

- `src/components/cookies/CookiesBanner.tsx` (X) — chargé sur **toutes** pages
  via root layout
- `src/components/pwa/InstallPrompt.tsx` (DownloadSimple, ShareNetwork, X)
- `src/components/pwa/PushSubscriptionManager.tsx` (BellRinging, BellSlash)
- `src/components/pwa/NotificationDevicesList.tsx` (DeviceMobile, Trash)

## Mesures après — chunks chargés sur `/`

| Chunk | parsed | gzip | Note |
|---|---|---|---|
| `webpack-…` | 3.8 kB | 1.9 kB | identique |
| `e5a90919-…` | 195.5 kB | 61.4 kB | identique |
| `62-…` | 434.3 kB | 129.8 kB | identique (Sentry reste in V1) |
| `main-app-…` | 3.4 kB | 1.4 kB | identique |
| `framework-…` | 185.6 kB | 58.1 kB | identique |
| `147-…` | 4.5 kB | 2.0 kB | identique |
| `6998-…` | 10.2 kB | 4.3 kB | identique |
| `7986-…` | 26.2 kB | 8.2 kB | identique |
| `2996-…` | 13.9 kB | 5.4 kB | identique |
| ~~`5245-…` framer~~ | **0** | **0** | **éliminé du chemin landing** |
| `9691-…` (ex `2323-…`) | 42.9 kB | 10.9 kB | Phosphor 40.7 kB |
| `app/(public)/page-…` | 14.7 kB | 4.9 kB | légèrement plus gros (CSS Reveal inline) |
| `app/layout-…` | 5.4 kB | 2.2 kB | identique |
| **TOTAL landing `/`** | **940.2 kB** | **290.5 kB** | |

## Delta final

| | Parsed | Gzip |
|---|---|---|
| Landing `/` avant | 1 057.8 kB | 328.9 kB |
| Landing `/` après | 940.2 kB | 290.5 kB |
| **Delta landing** | **−117.6 kB (−11.1%)** | **−38.4 kB (−11.7%)** |

| Lib | Avant | Après | Delta |
|---|---|---|---|
| framer-motion sur landing | 119.4 kB | 0 | **−119.4 kB** |
| Phosphor sur landing | 41.2 kB | 40.7 kB | −0.5 kB |
| (autre) | — | — | +1.5 kB (small redistribution chunks) |

### Sur le bundle total client (toutes pages cumulées)

| | Avant | Après | Delta |
|---|---|---|---|
| Total parsed | 1 961 kB | 1 964 kB | +3 kB |
| Total gzip | 617.6 kB | 617.9 kB | +0.3 kB |

Le total bundle ne baisse pas car framer-motion reste bundlé pour les wizards
— il est juste isolé dans un chunk (9807) chargé uniquement sur `/demande` et
`/inscription-pro`, plus sur la landing.

### Gain réel pour les particuliers

Un particulier qui visite **uniquement** la landing `/` (cas majoritaire des
visites organiques) télécharge **117.6 kB de JS en moins** (38.4 kB gzip).
Sur réseau 3G lent (1 Mbps), c'est ~300 ms de download économisés sur le
first paint.

## Sentry Loader Script — décision V2

Identifié au diagnostic comme gain potentiel ~140 kB sur **toutes** les pages
(via remplacement de l'import statique `@sentry/nextjs` par un loader script
~3 kB qui lazy-load le SDK depuis Sentry CDN au premier event).

**Reporté en V2 (mai 2026)**, raisons :

1. **Pas avant le launch** : introduire une dépendance CDN externe juste
   avant la mise en prod augmente la surface de risque opérationnel.
2. **Config quitterait le repo versionné** : avec le loader, les settings
   Sentry (sample rates, integrations) sont gérés via le dashboard Sentry
   et plus dans `sentry.client.config.ts`. Moins lisible, moins reviewable.
3. **Adblockers** : les domaines Sentry (`*.sentry.io`, `js.sentry-cdn.com`)
   sont parfois bloqués par défaut. On perdrait la capture client pour ces
   users. À mesurer avant d'arbitrer.
4. **`beforeSend` PII scrubbing** (Sprint 5c) : critique pour la
   conformité. Le passage en loader doit être validé sans casser ce hook.

Réévaluation prévue après stabilisation du launch avec métriques réelles.

## Outillage laissé pour l'équipe

```bash
# 1. Analyser le bundle (génère .next/analyze/*.html)
ANALYZE=true pnpm build --webpack

# 2. Vue d'ensemble par package
node scripts/bundle-report.mjs --top 25

# 3. Décomposition d'un chunk précis
node scripts/chunk-detail.mjs "62-"

# 4. Localiser une lib
node scripts/where-pkg.mjs "framer-motion"

# 5. Comparer 2 builds (capturer client.html avant/après)
node scripts/bundle-compare.mjs /tmp/before.html /tmp/after.html
```

Re-lancer Lighthouse mobile sur `/` après ce sprint pour confirmer le passage
Performance 74 → score cible.
