# DevisRapide — V2 Roadmap

Ce fichier track tout ce qui est connu, identifie, mais **hors perimetre MVP**. Repris au Sprint 5+ (polish) ou en V2 post-launch.

---

## Features V2 differees

### Pro / B2B
- [ ] **B2B "Appels d'offres & Grands Projets"** : pour gestionnaires d'immeubles et entreprises. Bloc placeholder `B2BSection` actuellement en mode "Bientot disponible". V2 = vraies fonctionnalites (RFP, multi-pros, contrats de maintenance).
- [ ] **Factures PDF automatiques** : generation et envoi auto au pro lors de chaque recharge wallet. V1 = facture manuelle envoyee par Kamel.
- [ ] **Dashboard pro avance** : statistiques de conversion, historique relances client, export CSV des leads.

### Client
- [ ] **Compte client optionnel** : V1 = pas de compte (juste email + telephone par demande). V2 = compte facultatif pour suivre ses demandes, historique.
- [ ] **Notation pro post-prestation** : V1 = aucun feedback boucle. V2 = email J+7 post-conversion avec lien de notation.

### Anti-spam / Verification
- [ ] **SMS OTP** : V1 utilise honeypot + rate limiting + Cloudflare Turnstile. V2 ajoute SMS OTP pour les comptes pros (verification numero) si abus constate.

### Trust signals
- [ ] **Trustpilot reel** : integration API Trustpilot pour afficher de vraies notes verifiees. V1 = mock visuel (note 4,7/5 et 412 avis hardcodes).
- [ ] **Calculateur dynamique** : les stats landing (`32 artisans verifies / 127 demandes ce mois / 4,7/5 / 4h delai`) sont hardcodees V1. V2 = queries reelles (`count` sur `Pro` + `Lead`).

### Belgique
- [ ] **Primes Wallonie via API** : V1 = lien externe vers `energie.wallonie.be` + texte fixe. V2 = simulation directe inline.
- [ ] **Flandre / Anvers / Belgique flamande** : V1 zone = Wallonie + Bruxelles francophone uniquement. V2 = extension Flandre (necessite traduction NL + adaptation seed catalogue + couverture pros).

### Push & PWA
- [x] ~~**PWA + Push** : architecture posee + branchement des 5 events~~ → fait Sprint 5.5 (manifest, SW manuel, web-push, 5 events lead/wallet/lifecycle).
- [ ] **Preferences notifications granulaires** : V1 master-switch `ProProfile.notifyByPush` tout-ou-rien. V2 = preferences par type d'event (nouveau lead ON, wallet faible OFF, etc.) + horaires de silence (DND nuit).
- [ ] **Centre de notifications in-app** : historique des push recus dans `/dashboard`. V1 = juste la notif systeme native, pas de relecture. V2 = panneau dropdown avec les 30 derniers events + mark-as-read.
- [ ] **Badging API** : afficher un badge sur l'icone PWA installee (compteur de leads PENDING non vus). Chrome desktop + Android, pas iOS Safari. `navigator.setAppBadge(n)`.
- [x] ~~**Optimisation bundle landing**~~ → fait Sprint 5.6 (Reveal CSS-only −119 kB framer-motion sur landing + Phosphor /dist/ssr sur 6 islands client). Detail avant/apres : `docs/sprint-5.6-bundle-audit.md`.
- [ ] **Update notification SW** : V1 strategie skipWaiting silencieuse (la nouvelle version du SW prend la main au prochain reload). V2 = toast "Nouvelle version disponible, rechargez" pour donner le controle au pro.

---

## Dette technique / polish (Sprint 5+)

- [x] ~~`<img>` Hero landing → migrer vers `next/image`~~ → fait Sprint 5b (commit `fix(hero)`).
- [x] ~~React Compiler warning sur `form.watch()` → migration `useWatch`~~ → fait Sprint 5b (commit `fix(wizards)`).
- [x] ~~Streaming Suspense par section sur le dashboard~~ → fait Sprint 5b (commits `feat(dashboard)`, `feat(admin)` Suspense streaming).
- [x] ~~Stats LP particulier hardcoded (`stats-mock.ts`)~~ → fait Sprint 5b (commit `refactor(stats)` launch-stats.ts avec queries reelles verifiedPros + monthlyLeads).
- [ ] **Vercel Pro upgrade — restaurer cron `process-leads` en `*/15 * * * *`** : pour le 1er deploy sur la team Hobby de Kamel, `process-leads` a ete downgrade a `0 8 * * *` (Hobby limite a 1 cron/jour). Quand Kamel prendra Pro ($20/mois), restaurer `*/15 * * * *` dans `vercel.json` ligne 6. `check-no-match-leads` `0 9 * * *` lui tourne deja sans probleme (daily).
- [ ] `FormMessage` shadcn → ajouter icone `AlertCircle` lucide en prefixe conditionnel.
- [ ] Wizard wrapper-category : implementer le skip Step 2 quand `universe.categories.length === 1` (concerne actuellement l'univers `autre`).
- [ ] Migration Prisma `siretNumber` → `vatNumber` sur `ProProfile` (Phase 4 BE, cf. `docs/architecture.md` §3.9).
- [ ] Sentry observability : pose le boundary `error.tsx`, ajouter le `Sentry.captureException` dedans (Sprint 5+).
- [ ] Charts/sparklines sur les cards stats du dashboard pro home (`/dashboard`). V1 = juste chiffres + delta %. Quand on aura un vrai historique journalier en prod, ajouter recharts (~50KB gzip).
- [ ] Page conseils detaillee + lien "Voir tous les conseils" actif sur le dashboard (`TipsSection`). V1 = 3 conseils statiques uniquement.
- [ ] **Header height en CSS var `--header-height`** : LeadFormWizard sticky top hardcodé à 76px. Refactor en CSS var pour eviter le silent breakage si le Header DS change de taille.
- [ ] **CATEGORY_COUNTS hardcoded** dans `src/lib/categories.ts` : compteurs "5 pros / 4 pros / ..." figés au launch. Migrer vers count Prisma temps réel quand le pool de pros sera stable (>50 pros par cat).
- [ ] **Job worker queue** (Inngest ou similaire) à la place du cron Vercel `process-leads`. Permet retry/dead-letter/parallélisation par segments + élimine le single-cron-fail-blocks-all.
- [ ] **Pino logger structuré** à la place des `console.error([context], ...)` partout. Permet query/filter en prod sérieuse + intégration Sentry naturelle.
- [ ] **mapPrismaError adoption progressive** : le helper existe (`src/lib/errors.ts`) mais le pattern P2002 inline dans `updateProProfileAdmin` reste en place. Migrer cross-actions au fur et a mesure.
- [ ] **CMP cookies banner** : V1 ne depose que des cookies essentiels (auth, CSRF, Stripe Checkout). Si analytics V2 (GA, Plausible, etc.) ou retargeting → banner consent obligatoire RGPD.
- [ ] **RGPD endpoints utilisateur** : `/dashboard/profil/donnees` avec download (export JSON/CSV des leads/transactions/profile) + delete (suppression compte + soft-delete cascadé). V1 = handled manuellement par Romain/Kamel.

---

## Performance V2 (post-launch)

- [ ] **Sentry CDN loader script** : remplace l'import statique `@sentry/nextjs` (140 kB sur toutes pages incluant landing) par un loader script `~3 kB` qui lazy-load le SDK complet depuis Sentry CDN au premier event. Gain ~140 kB sur le bundle client de toutes les pages. **Tradeoffs identifies au Sprint 5.6 et raison du report V2** : (1) dependance CDN externe (Sentry domaine sometimes adblock); (2) config Sentry quitte le repo versionne (loader settings via dashboard Sentry); (3) le `beforeSend` PII scrubbing custom doit etre re-valide en mode loader (le scrub Sprint 5c est cle pour conformite). A evaluer apres stabilisation du launch quand on aura du recul sur l'impact reel du SDK + des metriques precises sur les adblocks chez nos pros. Reference : tracked dans `docs/sprint-5.6-bundle-audit.md`.
- [ ] **Code-split aggressif routes admin** : `/admin/*` n'est jamais vu par les particuliers ni par les pros, mais ses chunks (8628, 4837, 759...) restent dans le bundle client total. Marquer ces routes en lazy-import au niveau du root layout admin pour qu'elles n'apparaissent dans aucun chunk shared cross-routes.
- [ ] **Replacer @phosphor-icons/react par @phosphor-icons/react-icons-stream** ou un pipeline d'import statique SVG : Phosphor pese 265 kB cumule sur 25 chunks. Une approche par SVG statiques (compile-time) ou par module barrel-free shippe seulement les SVG utilises sans le runtime React des composants.

---

## Sécurité V2

- [ ] **Migration CSP vers nonce-based** : Sprint 5c utilise `'unsafe-eval'` et `'unsafe-inline'` dans `script-src` / `style-src` car obligatoires pour Next.js runtime (HMR, hydration scripts, styled-jsx, next/font). V2 = mettre en place un middleware qui génère un nonce par requête + propager aux composants Next via headers + supprimer les `unsafe-*`. Complexe mais durcit fortement la CSP.
- [ ] **2FA admin** : Sprint 5c laisse `/admin/parametres` permettre uniquement le change email/password. V2 = TOTP via authenticator app (otplib) ou WebAuthn passkeys pour les comptes admin.
- [ ] **WAF Cloudflare** : reverse-proxy avec règles WAF (rate limit par pays, signatures bot, geo-blocking hors BE/EU). Complément à Turnstile (qui n'agit qu'au form-submit).
- [ ] **Stripe Radar config** : activer les règles Radar custom (block CVC mismatch, AVS fail, etc.) dans le dashboard Stripe. Action manuelle Romain, pas du code.

---

## Avant launch — informations Kamel

Placeholders dans le code qui doivent être complétés par les vraies données
légales/business avant le go-live :

### Mentions légales / coordonnées
- [ ] **Numéro TVA BE0XXX.XXX.XXX** — actuellement absent du footer (Sprint 5a a retiré la mention placeholder). À ajouter une fois Kamel a confirmé la forme finale.
- [ ] **Numéro BCE (Banque-Carrefour des Entreprises)** — à compléter dans `src/app/(legal)/mentions-legales/page.tsx` (placeholder `[À COMPLÉTER — Kamel]`).
- [ ] **Adresse siège social** — idem mentions légales.
- [ ] **Hébergeur** — actuellement Vercel + Neon. Bloc à finaliser avec coordonnées légales hébergeur.
- [ ] **Email DPO** si applicable (CNIL/RGPD délégué) — à confirmer avec Kamel.
- [ ] **Numéro de téléphone display** dans `src/lib/contact.ts:7` actuellement `"02 XXX XX XX"` placeholder visible publiquement (footer, pages contact). À remplacer par le numéro réel.
- [ ] **CGU clients / pros** : 4 pages dans `src/app/(legal)/` ont `updatedAt="[À COMPLÉTER — Kamel]"`. Date + revue juridique requise.
- [ ] **Politique de confidentialité** : idem, contenu juridique à valider.

### Configuration prod
- [ ] **ADMIN_EMAIL / ADMIN_INITIAL_PASSWORD** sur Vercel env prod = compte admin de Kamel. Aujourd'hui en preview `admin@admin.com` / `adminadmin` (dev only).
- [ ] **Stripe live keys** : passer de `sk_test_...` à `sk_live_...` sur Vercel env prod. Idem `STRIPE_WEBHOOK_SECRET` (configurer webhook endpoint sur dashboard Stripe en mode live).
- [ ] **RESEND_API_KEY** + **RESEND_FROM_EMAIL** sur Vercel env prod (domaine vérifié, ex: `noreply@devisrapide.be`).
- [ ] **VAPID keys** (push notifications) si Sprint 5.5 PWA est activé.
- [ ] **SENTRY_DSN** + **NEXT_PUBLIC_SENTRY_DSN** sur Vercel env prod.
- [ ] **NEXTAUTH_URL** sur Vercel env prod = `https://devisrapide.be` (ou domaine custom final).
- [ ] **DATABASE_URL** prod = endpoint Neon branche `production` (la branche actuelle vide après cleanup Sprint 5a).

### Cleanup BDD avant launch
- [ ] **Seed Neon production** : exécuter `pnpm db:seed` (sans `SEED_FAKES`) sur la prod pour créer catalogue + admin Kamel.
- [ ] Vérifier que `SEED_FAKES=true` **n'est PAS défini** dans l'env Vercel prod (sinon les fakes `.test@example.test` arriveraient en prod).

---

## Plan sprint MVP (rappel)

| Sprint | Focus | Statut |
|---|---|---|
| S0 | Foundation (Prisma, Auth, layouts, seed) | done |
| S1 | Creation lead client | done |
| **Sprint Design Refactor** | Reskin landing + wizard + pages annexes (404/500/legales) + design system pose | **done** |
| **S2a** | Matching backend (find/assign), wallet atomic debit, accept/refuse Server Actions, Vercel Cron expansion + timeout, emails pros (new lead / lead accepted) | **done** |
| **S2b** | Dashboard pro fonctionnel : 7 pages (home, leads, mes-demandes, wallet, profil + 2 détails) sur /dashboard/*, Server Actions CRUD profil, requireProSession helper, loading + error states | **done** |
| S3 | Wallet Stripe (recharge packs 70/300/800 via Stripe Checkout + webhook) | a faire |
| Phase 4 BE | Regex BE, JSON GeoNames, vatNumber, radii [30,60,OPEN], wallet packs. Catalogue 6 univers / 24 cats / 61 subs : **done** (cf. `prisma/seed.ts`) | partial |
| S4 | Panel admin + cron (autres jobs) | a faire |
| S5 | PWA + Push + emails + polish | a faire |
| S6 | Prod + retours Kamel | a faire |

Le **Sprint Phase 4 BE** est la prochaine priorite : il aligne le code (seed, regex, packs, matching) sur les cibles documentees dans `docs/architecture.md` §3.

---

## Reference des callouts "Phase 4" dans la doc

Toutes les regles metier ciblees Phase 4 (non encore en code) sont flaggees avec `> ⚠️ **Phase 4 — Cible non encore en code**` dans `docs/architecture.md`. Sections concernees :
- §3.2 Pricing (multiplicateur x2.5)
- §3.4 Matching (radii [30,60,OPEN], JSON GeoNames)
- §3.5 Wallet (packs 70/300/800)
- §3.7 LeadAssignment statuses
- §3.9 Belgique-specifics (VAT, postal, telephone, zone)
