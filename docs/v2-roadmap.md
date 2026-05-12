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
- [ ] **PWA + Push** : prevu Sprint 5 du MVP mais peut glisser en V2 si pression sur le launch (deja architecture posee : VAPID + Service Worker custom).

---

## Dette technique / polish (Sprint 5+)

- [ ] `<img>` Hero landing → migrer vers `next/image` (impact LCP, gain Lighthouse perf).
- [ ] React Compiler warning sur `form.watch()` dans `LeadFormWizard` → investiguer migration vers `useWatch` cible (lecture selective des fields plutot que watch global).
- [ ] `FormMessage` shadcn → ajouter icone `AlertCircle` lucide en prefixe conditionnel (TODO laisse dans `src/components/ui/form.tsx`).
- [ ] Pre-existing bug `SOS_UNIVERSE_SLUG = "sos-depannage"` dans `LeadFormWizard.tsx` : ne correspond a aucun universe du seed actuel (vrai slug = `urgence-services`). A corriger lors de la migration catalogue Phase 4.
- [ ] Migration Prisma `siretNumber` → `vatNumber` sur `ProProfile` (Phase 4 BE, cf. `docs/architecture.md` §3.9).
- [ ] Seed catalogue : passer de 6 univers FR a 2 univers BE (Travaux + SOS) cf. `docs/architecture.md` §3.1 (Phase 4).
- [ ] Sentry observability : pose le boundary `error.tsx`, ajouter le `Sentry.captureException` dedans (Sprint 5+).

---

## Plan sprint MVP (rappel)

| Sprint | Focus | Statut |
|---|---|---|
| S0 | Foundation (Prisma, Auth, layouts, seed) | done |
| S1 | Creation lead client | done |
| **Sprint Design Refactor** | Reskin landing + wizard + pages annexes (404/500/legales) + design system pose | **done** |
| S2 | Matching + dashboard pro lecture | a faire |
| S3 | Wallet Stripe + accept/refuse | a faire |
| Phase 4 BE | Migration catalogue 2 univers, regex BE, JSON GeoNames, vatNumber, radii [30,60,OPEN], wallet packs 70/300/800 | a faire (PROCHAIN) |
| S4 | Panel admin + cron | a faire |
| S5 | PWA + Push + emails + polish | a faire |
| S6 | Prod + retours Kamel | a faire |

Le **Sprint Phase 4 BE** est la prochaine priorite : il aligne le code (seed, regex, packs, matching) sur les cibles documentees dans `docs/architecture.md` §3.

---

## Reference des callouts "Phase 4" dans la doc

Toutes les regles metier ciblees Phase 4 (non encore en code) sont flaggees avec `> ⚠️ **Phase 4 — Cible non encore en code**` dans `docs/architecture.md`. Sections concernees :
- §3.1 Catalogue (2 univers BE)
- §3.2 Pricing (multiplicateur x2.5)
- §3.4 Matching (radii [30,60,OPEN], JSON GeoNames)
- §3.5 Wallet (packs 70/300/800)
- §3.7 LeadAssignment statuses
- §3.9 Belgique-specifics (VAT, postal, telephone, zone)
