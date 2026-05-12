# Prompt Claude Code — DevisRapide Sprint Design Refactor (Phase 2 reliquats)

## Contexte projet (rappel court)

DevisRapide.be — plateforme web BE de mise en relation particuliers ↔ artisans, pay-per-lead avec wallet rechargeable côté pro. Client Kamel, scope V1 défini.

Stack : Next 16.2.4 + React 19.2 + TS strict + Tailwind v4 + shadcn (base-nova, radius ~8px) + Auth.js v5 + Prisma 6 + Neon Postgres + framer-motion + lucide-react.

Branche active : `feat/design-refactor` depuis `dev`.

**Ce qui est déjà fait dans ce sprint** : intégration Claude Code de la landing publique `/` (DS posé, palette validée, composants `src/components/ds/*` créés, framer-motion en place, photo hero étendue OK). Tu as donc déjà tous les composants et tokens en place.

**Ce qui reste pour clôturer la Phase 2** : reskin du wizard `/demande` (logique 100% intacte), `/demande/confirmation`, 4 pages légales placeholder, `/404` et `/500`.

---

## Mission de cette session

Finir la Phase 2 du Sprint Design Refactor :

1. **`/demande`** — reskin visuel du wizard 6 étapes, logique 100% préservée, transitions framer-motion fade 250ms entre steps
2. **`/demande/confirmation`** — reskin
3. **Pages légales** `(legal)/mentions-legales`, `cgu-clients`, `cgu-pros`, `confidentialite` — texte placeholder Belgique générique
4. **`/404` et `/500`** — illustrations légères + CTA retour, cohérent DS

**Hors périmètre absolu de cette session** :
- Pages pro (`/pros`, `/connexion`, `/inscription-pro/*`, `/compte-suspendu`) → Phase 3
- Adaptations Belgique métier (geocoding GeoNames, regex postal, regex tel BE, VAT, seed catalogue, AppConfig, followupStatus) → Phase 4
- Migration Prisma `siretNumber → vatNumber` → Phase 4
- Docs `docs/*.md` → Phase 5
- Sprint 2 matching, Sprint 3 wallet Stripe, etc.

Si tu touches au moindre fichier hors de ce périmètre, **stop & ask** avant.

---

## Hiérarchie d'autorité

1. **Code TS existant + Server Actions** = vérité absolue. La logique du wizard, Zod schemas, Server Actions `createLead` → on n'y touche pas.
2. **Composants `src/components/ds/*` déjà créés** (Header, Hero, Footer, etc.) = spec visuelle. Tu réutilises les tokens, classes, variants déjà en place.
3. **shadcn `src/components/ui/*`** = primitives. Si besoin d'un nouveau variant, étend via cva, ne crée pas de duplicata.
4. **Ambiguïté visuelle** = stop & ask. Mieux poser une question que d'inventer.

---

## Pattern à suivre : Audit → Plan → Validation → Implémentation → Récap

### 1. Audit (sans coder)

Lire et reporter :

- **Wizard `/demande`** :
  - Liste tous les fichiers (page, layout, composants step, hooks, schemas, server actions liés)
  - Décrire la structure de chaque step : props, state local, transitions actuelles
  - Identifier les éléments visuels à refondre (cards, boutons, progress bar, inputs, error states, loading states)
  - Lister les composants UI legacy (Button local, Card local, etc.) qui doivent passer en shadcn ou DS
- **`/demande/confirmation`** : structure actuelle, contenu affiché, état post-soumission
- **Pages légales** : ce qui existe (peut-être rien), structure de routing `(legal)/`, layout partagé éventuel
- **`/404` et `/500`** : existant Next default ou custom déjà en place ?
- **Composants DS et UI dispo** : confirmer ce que tu peux réutiliser depuis la landing (Header, Footer, Button variants, TrustpilotBadge, etc.)
- **framer-motion** : confirmer version installée et patterns déjà utilisés sur la landing

### 2. Plan

Proposer un plan en commits atomiques (Conventional Commits : `feat`, `refactor`, `chore`, `docs`). Format attendu :

```
1. refactor(demande): bascule layout wizard sur tokens DS + Header/Footer DS
2. refactor(demande): reskin Step 1 (univers) en réutilisant Card DS
3. refactor(demande): reskin Steps 2-3 (catégorie + sous-catégorie)
4. refactor(demande): reskin Steps 4-5-6 (description+urgence, postal, contact)
5. feat(demande): transitions framer-motion fade 250ms entre steps
6. refactor(demande): reskin progress bar wizard
7. refactor(demande): reskin /demande/confirmation
8. feat(legal): layout + 4 pages légales placeholder BE
9. feat(errors): pages /404 et /500 customisées avec illustration + CTA
10. chore: vérif build, lint, types stricts
```

Estimer ~8-12 commits. Ajuste selon ton audit.

**Stop ici. N'implémente pas tant que je n'ai pas validé.**

### 3. Validation

J'attends de toi : "Voici l'audit + le plan. Je commence ?" → je relis, je valide ou j'ajuste.

### 4. Implémentation

Commit par commit. Après chaque commit :
- `pnpm build` + `pnpm lint` + `pnpm tsc --noEmit` doivent passer
- Si une étape casse quelque chose, tu stoppes et m'expliques avant de pousser plus loin

### 5. Récap final

Liste :
- Fichiers créés / modifiés / supprimés
- Divergences par rapport au plan (avec raison)
- Commandes lancées et leur résultat
- Captures à prendre côté Romain pour valider visuellement (liste les écrans à regarder)
- TODO résiduels éventuels

---

## Spécifications détaillées par bloc

### A. Wizard `/demande` — reskin

**Règle d'or : logique métier 100% préservée.** Les 6 étapes restent dans le même ordre :

1. Univers (Travaux / SOS Dépannage)
2. Catégorie
3. Sous-catégorie
4. Description + urgence
5. Code postal
6. Contact (prénom, nom, email, téléphone)

Ce qui change :
- **Composants UI** : tout ce qui est Button/Card/Input/Label/Select/Textarea legacy passe en shadcn `src/components/ui/*` avec les variants DS définis (notamment Button `accent` orange, `outline-white`, etc.)
- **Icônes** : remplacer tout SVG inline par `lucide-react`
- **Couleurs** : que les tokens DS (`primary` bleu marine `#1e3a8a`, `accent` orange `#ea580c`, neutres slate). Zéro couleur hardcodée hors palette.
- **Typo** : Inter only, weights 400/500/600/700
- **Cards de sélection** (univers, catégorie, sous-catégorie) : reprendre le style des Cards Categories de la landing pour cohérence — radius ~8px, shadow léger, hover état clair, focus visible
- **SOS Dépannage** : accent rouge/orange + badge "Urgence 24/7" visible dans le step 1 et persistant en sur-titre dans les steps suivants quand univers = sos-depannage
- **Progress bar** : segments 1/6 → 6/6, label step courant, design sobre, tokens DS. Pas de pourcentages flashy.
- **Boutons nav wizard** : "Précédent" en `outline`, "Suivant" / "Envoyer ma demande" en `accent` orange (sur dernier step le label change clairement)
- **Erreurs Zod** : style cohérent avec landing (texte rouge sobre, icône `lucide AlertCircle`, jamais en gros block rouge fluo)
- **États loading** sur submit final : bouton disabled + spinner lucide `Loader2` qui tourne
- **Mobile-first** : padding correct, inputs `inputMode` adaptés (email, tel, numeric pour postal), keyboard accessory friendly

**Transitions framer-motion entre steps** :
- `AnimatePresence mode="wait"` autour du step courant
- Chaque step wrappé dans `motion.div` avec :
  - `initial={{ opacity: 0, y: 8 }}`
  - `animate={{ opacity: 1, y: 0 }}`
  - `exit={{ opacity: 0, y: -8 }}`
  - `transition={{ duration: 0.25, ease: "easeOut" }}`
- Respecter `prefers-reduced-motion` (framer le gère via `useReducedMotion()` — fallback transition `duration: 0`)
- **Surtout pas** de transition sur le formulaire global qui ferait disparaître le state — uniquement la zone "contenu du step"

**Ce que tu NE touches PAS** :
- Schemas Zod (`src/schemas/lead.ts`)
- Server Action `createLead`
- Hooks de gestion du wizard state (sauf si purement visuel)
- Regex postal, regex tel, validation email — restent en l'état (Phase 4 les adaptera BE)
- L'ordre des steps
- Route et query params (`?universe=travaux&category=plomberie` etc.)

### B. `/demande/confirmation`

- Réutiliser Header + Footer DS
- Card centrée avec icône succès `lucide CheckCircle2` en vert sobre (pas le vert Trustpilot)
- Titre clair "Demande envoyée"
- Texte rassurant : prochaines étapes (réception email, pros rappellent sous X temps, etc.) — reprendre le wording existant si présent, juste reskin
- CTA secondaire "Retour à l'accueil" en outline → `/`
- Bloc "Un problème ?" avec lien email contact (placeholder ou existant)
- Pas d'animation lourde, juste un fade-in léger framer-motion à l'arrivée si tu veux

### C. Pages légales `(legal)/*`

4 routes :
- `/mentions-legales`
- `/cgu-clients`
- `/cgu-pros`
- `/confidentialite`

**Structure** :
- Layout partagé `(legal)/layout.tsx` avec Header + Footer DS, container max-width prose, padding vertical généreux
- Composant typographique `<LegalContent>` ou similaire avec styles `prose` Tailwind (sobre, lisible, h1/h2/h3 hiérarchisés sur tokens DS)
- Une sidebar facultative pour TOC desktop si tu trouves ça pertinent — sinon pas grave, on garde simple

**Contenu placeholder Belgique générique** (tu peux générer du texte plausible) :
- Chaque page contient des h1 + h2 + paragraphes lorem-ish mais réalistes pour le contexte BE
- Mettre en placeholder explicite : raison sociale, SIREN/BCE, adresse siège, hébergeur, DPO, etc. avec format `[À COMPLÉTER — Kamel]`
- Date de dernière mise à jour en placeholder également
- TVA mentionnée à 21% (BE)
- Mentionner que la plateforme opère en Belgique francophone (Wallonie + Bruxelles)

**Sections minimales par page** :
- **Mentions légales** : éditeur, hébergeur, contact, propriété intellectuelle, responsabilité
- **CGU Clients** : objet, accès au service, demande de devis, gratuité côté client, données collectées, durée, modification, résiliation, droit applicable BE
- **CGU Pros** : objet, conditions d'inscription, validation par l'admin, modèle pay-per-lead, fonctionnement wallet, packs et bonus (70/300/800€), prix exclusif x2.5, statuts post-acceptation, suspension de compte, droit applicable BE, juridiction compétente
- **Confidentialité (RGPD)** : données collectées particuliers/pros, finalités, bases légales, durée conservation, droits (accès/rectif/effacement/portabilité), cookies, contact DPO

Si Kamel fournit les vrais textes plus tard, on swap juste le contenu — la structure reste.

### D. `/404` et `/500`

**`/404`** (`src/app/not-found.tsx`) :
- Header + Footer DS
- Illustration légère : pas de SVG monstre, juste un visuel sobre cohérent. Option simple : grand chiffre "404" en typo Inter weight 700, taille XXL, couleur `primary` avec un soupçon de `accent` orange sur un détail (point sur le 0, soulignement, etc.). Pas de mascotte, pas de gradient.
- Titre "Page introuvable"
- Texte court rassurant
- 2 CTA : `accent` "Retour à l'accueil" → `/`, `outline` "Faire une demande" → `/demande`
- Optionnel : petit lien discret "Signaler un problème" en bas

**`/500`** (`src/app/error.tsx` — Client Component, requis par Next) :
- Même esprit que 404
- Chiffre "500" en gros, plus sobre encore (rouge atténué ou primary pur)
- Titre "Une erreur est survenue"
- Texte court : "Réessayez dans un instant. Si le problème persiste, contactez-nous."
- CTA `accent` "Réessayer" → `reset()`, CTA `outline` "Retour à l'accueil"
- Penser à logger l'erreur côté serveur (si pas déjà fait globalement)

---

## Conventions de code (rappel strict)

**TypeScript** : strict mode, zéro `any`, zéro `as any` douteux, discriminated unions sur les variants, inférence privilégiée.

**Next 16 / React 19** :
- Server Components par défaut, `'use client'` UNIQUEMENT quand nécessaire (gestion de state, framer-motion, event handlers)
- `'use client'` placé le plus bas possible dans l'arbre
- Pattern "Client island" : Server wrapper + Client minimal pour les portions interactives du wizard
- `generateMetadata` sur chaque page (titre + description appropriés)

**Tailwind v4** : tokens depuis `@theme inline`, pas d'inline styles sauf dynamiques calculés, `@utility` pour les patterns récurrents.

**Imports** :
- `cn` depuis `src/lib/utils.ts` (jamais redéfini localement)
- Composants UI depuis `src/components/ui/*`
- Composants DS depuis `src/components/ds/*`
- Icônes depuis `lucide-react` (named imports directs)

**Commits** : Conventional Commits, messages clairs en anglais, scope quand pertinent. Exemples :
- `refactor(demande): apply DS tokens to wizard step 1 (universe)`
- `feat(demande): add framer-motion step transitions with reduced-motion fallback`
- `feat(legal): add 4 BE placeholder pages under (legal) route group`
- `feat(errors): customize 404 and 500 pages with DS-aligned illustrations`

---

## Stop & ask explicite — tu m'arrêtes si :

- Une lib non listée serait nécessaire (ex : tu veux ajouter `react-aria`, `vaul`, etc.)
- Un pattern non standard est requis (ex : refacto significative d'un Server Action existant)
- Une décision visuelle n'est pas spécifiée ici et tu hésites entre 2 options
- Le contenu placeholder légal te paraît trop / pas assez détaillé
- Une page existe déjà avec un contenu non trivial que tu ne veux pas écraser sans confirmation
- Tu détectes une régression potentielle sur la logique wizard

---

## Critère de succès

À la fin de cette session :
- Wizard `/demande` visuellement raccord avec la landing, transitions douces entre steps, logique inchangée (un lead se crée toujours correctement)
- `/demande/confirmation` cohérent DS
- 4 pages légales accessibles, contenu placeholder propre, structure réutilisable quand Kamel fournit les vrais textes
- `/404` et `/500` customisées, sobres, alignées DS
- Build + lint + tsc OK
- Aucun fichier hors périmètre touché
- Récap clair en fin de session

---

## Démarrer

Commence par **l'Audit**. Pas une ligne de code avant que je valide ton plan.
