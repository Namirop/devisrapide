# Tests manuels — DevisRapide

Document évolutif. Une section par sprint. À dérouler avant chaque merge vers `dev`.

---

## Sprint 1 — Création de lead client

### Préparation

- Variables d'env présentes : `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`,
  `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
- Migration + seed à jour : `pnpm db:deploy && pnpm db:seed`.
- Démarrer le dev server : `pnpm dev`.

### Scénario nominal

> ⚠️ Le wizard ne persiste pas l'état au refresh (S1). Faire le test d'une traite sans rafraîchir la page.

1. Ouvrir `http://localhost:3000/demande` (ou la preview Vercel).
2. Étape 1 : sélectionner **Techniques & Énergie** → cliquer Suivant.
3. Étape 2 : sélectionner **Plomberie** → Suivant.
4. Étape 3 : sélectionner **Dépannage urgent** → Suivant.
5. Étape 4 : saisir une description ≥ 20 caractères, urgence **Urgent** → Suivant.
6. Étape 5 : code postal `59000`, adresse facultative `12 rue Faidherbe` → Suivant.
7. Étape 6 : `firstName=Jean`, `lastName=Dupont`, `email=jean.dupont+test@example.com`, `phone=0612345678` → **Envoyer ma demande**.
8. Vérifier la redirection vers `/demande/confirmation`.

### Vérifications BDD (`pnpm db:studio`)

- Table `Lead` : nouvelle ligne avec
  - `status = PENDING_MATCH`
  - `city = "Lille"` (ou commune équivalente retournée par BAN pour 59000)
  - `latitude` / `longitude` non nulls
  - `sharedLeadPriceCentsSnapshot` et `exclusiveLeadPriceCentsSnapshot` remplis (cohérents avec le prix Plomberie au seed : 2500 / 5500)
  - `currentRadiusKm = 25`
  - `expiresAt` ≈ now + 24h
- Table `User` : ligne avec `email = jean.dupont+test@example.com`, `role = CLIENT`,
  `firstName/lastName/phone` corrects.

### Vérifications logs serveur

- `[matching] TODO Sprint 2: matching for lead <id>` doit apparaître.
- Si `RESEND_API_KEY` est configuré : pas de warning.
- Si `RESEND_API_KEY` est vide : un `[email] RESEND_API_KEY absent — fallback console.` avec le contenu rendu.

### Email

- Inbox de l'email saisi : email "Votre demande de devis a bien été reçue" reçu (vérifier dossier spam au S1, le DNS n'est pas configuré, expéditeur `onboarding@resend.dev`).

### Cas d'erreur à tester

| Cas | Étape | Comportement attendu |
|---|---|---|
| Code postal `00000` | 5 | Erreur "Aucune commune trouvée…" → reste sur étape 5 |
| Code postal `59` (4 chiffres) | 5 | Erreur Zod "Code postal invalide" |
| Description < 20 chars | 4 | Erreur Zod, blocage du Suivant |
| Email malformé | 6 | Erreur Zod |
| Téléphone `+1 555 1234` | 6 | Erreur Zod (regex FR/BE uniquement) |
| 6e soumission successive (même IP, < 1h) | 6 | Toast "Trop de demandes…" (rate limit Upstash) — uniquement si Upstash configuré |
| Refresh entre 2 étapes | n'importe | Le wizard reprend à l'étape 1 (pas de persistance S1, comportement attendu) |

### Sortie attendue

- 1 `Lead` PENDING_MATCH en BDD.
- 1 `User` CLIENT en BDD.
- 1 email envoyé (ou loggé en console).
- 0 erreur dans les logs serveur (hormis stub matching attendu).

---

## Sprint Design Refactor — scénarios de test

À dérouler avant merge vers `dev` après tout changement design landing / wizard / pages annexes. Pas de tests automatisés, juste un sweep visuel + interaction.

### Landing publique `/`

1. Ouvrir `/`. Scroller du Hero au Footer.
2. **Alternance backgrounds** : Hero / Stats / HowItWorks transparents (pattern grille visible), Wallonia + B2B en `bg-slate-50` opaque (panneau gris couvre la grille), Categories / Testimonials transparents. Pas de section qui "saute" visuellement.
3. **Pattern grille** : continu d'un bout à l'autre, pas de carrés coupés brutalement aux limites de section.
4. **Hero** : photo artisan visible centre, fade blanc sur les côtés sans halo, formulaire à droite avec catégories cliquables (`SOS` par défaut sélectionné).
5. **Stats** : 4 tuiles sur fond `#1a2950` opaque, valeurs blanches, icônes orange chaud `#fb923c`, labels slate-300.
6. **HowItWorks** : 3 étapes (Décrivez / Recevez / Choisissez), flèches SVG longues centrées verticalement entre étapes. Hover sur une étape = lift -translate-y-1 + cercle navy fill + icône scale.
7. **WalloniaBanner** : carte jaune écusson + coq, CTA "Simuler mes aides" ouvre `energie.wallonie.be` dans nouvel onglet.
8. **Categories** : 9 tuiles en effet tableau (séparateurs internes 1px slate-200), tuile SOS rouge avec pill "24/7". Click → `/demande?universe=…&category=…`.
9. **B2BSection** : card navy avec illustration immeubles, CTA "Bientôt disponible" désactivé.
10. **Testimonials** : bande Trustpilot sans border-y (pas de lignes grises), 3 témoignages clients.
11. **Footer** : 4 colonnes (services, régions, espace pro, devisrapide), liens légaux fonctionnels.

### Wizard `/demande`

1. Ouvrir `/demande`. Step 1 affiché.
2. **Progress bar** : 6 barres + numéros au-dessus, sticky `top-[76px]` (juste sous le Header DS). Reste visible quand on scroll un step long. Step actif = numéro bold slate-900, complétés = check lucide navy, suivants = gris. Time text `~90 s` à droite.
3. **Step 1 Universe** : cards avec icône lucide à gauche + divider + nom/preview catégories à droite. Card "Urgence & Services" en orange subtil même non sélectionnée. Sélection = bg accent dans la zone icône.
4. **Step 2-3** : cards verticales avec ChevronRight, bordure navy sur sélection (pas de ring double). Step 2 = 8 catégories Travaux toutes visibles à leur taille naturelle (plus de troncage / chevron de scroll interne).
5. **Step 4** : textarea description + 4 cards urgence compactes (icône 6×6, label 15px, hint 12px) en grid 2×2. Card "Urgent" en orange permanent. Sélection = bordure navy/orange + bg dans zone icône.
6. **Step 5** : input postal (placeholder `1000`) + input adresse facultatif avec icônes MapPin/User.
7. **Step 6** : 4 inputs (prénom, nom, email, téléphone) avec icônes lucide.
8. **Transitions** : framer-motion fade entre steps (~250ms). Respect `prefers-reduced-motion` (testable via OS settings).
9. **Nav buttons** : Précédent (outline) à gauche, Suivant / Envoyer (accent orange) à droite. `mt-auto + sticky bottom-0` → comportement décrit en §"Layout responsive" ci-dessous.
10. **SOS badge server-side** : ouvrir `/demande?universe=sos-depannage` (ou `?universe=urgence-services` selon état seed) → badge orange "Urgence 24/7" affiché **dès le premier render** (pas de flash après hydration). Note : actuellement le slug attendu par le code (`sos-depannage`) ne correspond pas au seed (`urgence-services`) — bug pré-existant tracké dans `v2-roadmap.md`, à corriger Phase 4.
11. **Submit final** : Step 6 rempli + Envoyer → redirection vers `/demande/confirmation`. Bouton Loader2 spinner pendant l'envoi.

#### Layout responsive (refonte sprint design)

Pattern CSS-only basé sur `flex-1` qui se propage `main → wrapper → section → form → step content` + `position: sticky` sur progress bar et nav buttons. À tester sur au moins **un écran haut (≥1440px)** et **un écran standard (1080p ou laptop ~900px)**.

**Cas A — Grand écran + step court (ex: Step 1 sur 1440p ou 2560×1440)** :
- Page **non scrollable** (tout tient dans le viewport).
- Wizard occupe toute la zone entre Header DS et Footer DS sans gap.
- Nav buttons Précédent/Suivant collés juste au-dessus du Footer DS (via `mt-auto`).
- Footer DS visible en bas de viewport, classique sticky footer.
- **Régression à surveiller** : aucune zone vide entre les cards du step et les nav buttons, ni entre les nav buttons et le Footer.

**Cas B — Écran moyen + step long (ex: Step 2 avec 8 catégories Travaux sur 1080p)** :
- Page scrollable normalement (scroll natif navigateur, plus de scroll interne au wizard).
- Header DS reste sticky top-0 pendant le scroll.
- Progress bar reste sticky `top-[76px]` juste sous le Header.
- Nav buttons sticky `bottom-0` pendant le scroll → toujours accessibles sans scroller jusqu'en bas.
- Quand l'utilisateur scrolle jusqu'au bas du wizard, les nav buttons se **relâchent** naturellement à leur position et le Footer DS apparaît juste en-dessous (transition fluide CSS native, pas de chevauchement).

**Cas C — Mobile (≤640px viewport)** :
- Identique à Cas B.
- Vérifier sur iOS : le `pb-[max(1rem,env(safe-area-inset-bottom))]` sur les nav buttons empêche le collage à la barre nav iOS / home indicator.
- Vérifier que le bouton Suivant n'est pas masqué par le clavier virtuel quand le focus est sur un input (Step 4 description, Step 5 postal, Step 6 contact).

**Cohérence visuelle de la grille** :
- Le pattern grille (`.bg-grid-pattern` avec `background-attachment: fixed`) couvre toute la zone sous le Header.
- Pas de "grille sur grille" décalée au niveau des sticky bars : les grilles du wrapper et des sticky bars partagent l'origine viewport grâce à `bg-fixed`.
- Sticky bars en `bg-white` opaque : le contenu qui scroll derrière est correctement masqué (pas de cards visibles à travers les barres).

**Régression à surveiller post-refonte** :
- Aucun scroll interne dans le wizard (le composant `ScrollIndicator` a été supprimé).
- Pas de `useEffect` qui lock `html.style.overflow` ou `body.style.height` (le pattern `flex-1` rend ce hack inutile).
- Sur grand écran, le Footer DS doit toujours être collé en bas du viewport — si une zone blanche apparaît, c'est que `flex-1` ne se propage pas sur un maillon de la chaîne (vérifier `(public)/layout.tsx` → `main` a bien `flex flex-1 flex-col`).

### `/demande/confirmation`

1. Eyebrow orange `DEMANDE ENVOYÉE` en haut.
2. H1 "Merci, votre demande est partie." en 34-42px.
3. 3 cards "next steps" : Email confirmation / Pros qui vous contactent / **Délai de réponse moyen — Sous 4 heures**. Icônes lucide en haut-gauche de chaque card, pas de cercle de fond.
4. CTAs : Retour à l'accueil (accent) + Faire une autre demande (outline).
5. Lien email contact en bas.

### Pages légales `(legal)/*`

1. Ouvrir `/mentions-legales`, `/cgu-clients`, `/cgu-pros`, `/confidentialite`.
2. Header + Footer DS présents sur toutes.
3. Typographie `prose`-like sobre (h2 navy, p slate-600, ul list-disc).
4. Placeholders `[À COMPLÉTER — Kamel]` visibles partout où Kamel doit fournir le texte final (raison sociale, BCE, adresse, DPO, dates).
5. Pas de TOC, layout simple linéaire.

### `/404`

1. Ouvrir une URL bidon (`/url-qui-n-existe-pas`).
2. Chiffre `404` géant clamp(140,22vw,240px) en navy, **point orange à la place du "0"** (cercle plein `#ea580c`, vertical-align middle, ~0.58em).
3. H1 "Cette page a changé de chantier." 36-48px.
4. Sous-texte "Le lien que vous avez suivi n'est plus disponible." une seule ligne.
5. CTAs : Retour à l'accueil (accent) + Faire une demande (outline). Pas de lien "Signaler un problème".

### `/500`

> Test à effectuer manuellement avant chaque PR landing/wizard. Pas une fois pour toutes.

1. Ajouter un `throw new Error("test 500 — DELETE ME")` au début d'un Server Component de page (ex: `src/app/(public)/demande/page.tsx`).
2. `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/demande` → doit retourner `500`.
3. Ouvrir `/demande` dans le browser → `error.tsx` rend :
   - `500` géant clamp(140,22vw,240px) en navy
   - `AlertTriangle` lucide accent orange à côté (sm+)
   - H1 "Une erreur est survenue"
   - Sous-texte avec lien `mailto:contact@devisrapide.be`
   - CTAs : Réessayer (accent, appelle `reset()`) + Retour à l'accueil (outline)
4. Cliquer Réessayer → log console error visible, page re-render (échoue à nouveau puisque le throw persiste).
5. **Retirer le throw**. Vérifier `grep "throw new Error(\"test" src/` → 0 résultat avant commit.

### Sortie attendue Sprint Design Refactor

- Landing fluide, rythme vertical, aucune erreur console.
- Wizard 6 étapes navigables avec transitions, soumission OK → confirmation.
- Layout wizard : Cas A / B / C ci-dessus validés sans gap, sans scroll interne, sans chevauchement nav/Footer.
- Pages annexes (`/404`, `/500`, légales) accessibles et alignées DS.
- `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` : zéro erreur, warnings préexistants trackés dans `docs/v2-roadmap.md`.

---

## Sprint 2a — Matching + lifecycle backend

Pas d'UI pour ce sprint (Sprint 2b livrera le dashboard pro). Tests
exécutés via Prisma Studio + curl pour le cron + Resend dashboard pour
les emails.

### Préparation

- BDD avec catalogue 6 univers + admin Kamel (cf. seed Phase 4 BE).
- Au moins 2 pros VALIDATED en BDD avec :
  - `latitude / longitude` cohérents avec un code postal de test
  - `interventionRadiusKm` configuré
  - `walletBalanceCents >= 5000` (50€, assez pour accepter quelques leads)
  - une `ProCategory` pour au moins une catégorie testable
  - 1 pro avec `autoAccept = false` (manuel), 1 avec `autoAccept = true`
- `CRON_SECRET` posé dans `.env.local`.

### Scénario 1 — Création lead → matching palier 0 → assignments PENDING

1. `pnpm dev` puis ouvrir `/demande`.
2. Soumettre un lead Plomberie / Bruxelles `1000` avec urgency `URGENT`.
3. Vérifier en BDD (Prisma Studio) :
   - `Lead` créé avec `status = PENDING_MATCH`, `matchingStartedAt` ≈ now,
     `currentRadiusKm = 30`, `expiresAt` ≈ now + 24h.
   - Le `sharedLeadPriceCentsSnapshot` est ×1.3 du prix de base de la
     catégorie (modulateur URGENT).
   - `LeadAssignment` créées pour chaque pro VALIDATED dans la cat +
     dans le rayon 30km.
4. Pro avec `autoAccept = true` : son assignment est **direct ACCEPTED**,
   `walletBalanceCents` décrémenté de `priceCents`, `WalletTransaction`
   créée (type `LEAD_DEBIT`), `acceptedAt` rempli.
5. Pro avec `autoAccept = false` : assignment **PENDING**, wallet
   inchangé.
6. Emails reçus sur Resend dashboard :
   - 1 "Demande reçue" au client
   - 1 "Lead accepté" au pro auto-accept (coordonnées complètes)
   - 1 "Nouveau lead disponible" au pro manuel (coordonnées masquées)

### Scénario 2 — Acceptation manuelle via Server Action

Pas d'UI : on simule l'appel à la Server Action `acceptLeadAssignment`
via Prisma Studio + un script ou via la dashboard pro Sprint 2b.

Alternative dev : utiliser `pnpm exec tsx -e` pour appeler directement
la Server Action depuis un shell Node avec un faux contexte session.

Vérifs attendues :
- `LeadAssignment.status = ACCEPTED`, `acceptedAt` rempli.
- `ProProfile.walletBalanceCents` décrémenté.
- `WalletTransaction` créée.
- Si lead atteint `SHARED_LEAD_MAX_ACCEPTANCES` (3 par défaut) : autres
  PENDING → `EXPIRED`, `Lead.status = ACCEPTED`.
- Email "Lead accepté" envoyé au pro.

### Scénario 3 — Refus

Appeler `refuseLeadAssignment(assignmentId, reason?)`. Vérifs :
- `status = REFUSED`, `refusedAt` rempli, `refusalReason` enregistré.
- Pas d'email envoyé.
- Wallet inchangé.

### Scénario 4 — Cron expansion + timeout

Tester localement via curl :

```bash
curl -i -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/process-leads
```

- 401 si CRON_SECRET incorrect.
- 200 + JSON `{ok, stats, at}` sinon.

Pour tester l'expansion sans attendre 2h en réel : en Prisma Studio,
modifier manuellement `Lead.matchingStartedAt` à une date passée de
≥ `ZONE_EXPANSION_DELAYS_MIN[0]` minutes (120 par défaut). Re-curl le
cron : `stats.expandedToPalier1` ≥ 1.

Re-tester pour palier 2 (`matchingStartedAt` antidaté de 240 min).

Test timeout : antidater `Lead.expiresAt` au passé. Cron → `stats.timedOut`
≥ 1, `Lead.status = EXPIRED`, assignments PENDING → EXPIRED.

### Scénario 5 — Lock 3 max + lead full

Avec ≥ 4 pros VALIDATED dans la cat + zone, créer un lead. Tous
deviennent PENDING. Simuler 3 acceptations successives. À la 3ᵉ :
- Lead.status = ACCEPTED
- Le 4ᵉ assignment PENDING → EXPIRED (via updateMany dans la tx)
- La 4ᵉ acceptation depuis la Server Action retourne `LEAD_FULL`.

### Scénario 6 — Wallet insuffisant

Pro avec `walletBalanceCents = 0`. acceptLeadAssignment → retourne
`INSUFFICIENT_FUNDS`, pas de débit, assignment reste PENDING.

### Sortie attendue Sprint 2a

- `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` : zéro erreur.
- BDD : modèles Lead/ProProfile/LeadAssignment étendus avec les nouveaux
  champs (cf. migration `sprint2_matching_fields`).
- Création lead → assignments PENDING/ACCEPTED selon mode pros.
- Cron fonctionnel sur les 3 scans.
- Emails Resend visibles dans le dashboard (templates `NewLeadPro` +
  `LeadAcceptedPro`).
- Aucune UI touchée (sprint pure backend).

---

## Sprint 2b — Dashboard pro (UI fonctionnelle)

7 pages dashboard branchées sur le backend Sprint 2a. Tests via login
pro VALIDATED + navigation + actions (accept/refuse/qualif/profil).

### Comptes pros de test (sur la BDD preview Neon)

3 pros pré-seedés via `scripts/seed-test-pros.ts` pour couvrir les 3
cas du middleware. Mot de passe identique pour les 3 : **`Test1234`**
(8 chars, 1 majuscule, 1 chiffre — respecte les règles du Sprint 3).

| Email | Status | Comportement attendu après login |
|---|---|---|
| `pro-valid@devisrapide.test` | VALIDATED | Accès complet à `/dashboard/*`. Inscrit à la catégorie Plomberie, walletBalanceCents = 100000 (1000€), Bruxelles (50.8503, 4.3517), rayon 30km. |
| `pro-pending@devisrapide.test` | PENDING | Redirect immédiat `/inscription-pro/en-attente`. Pas d'accès au dashboard. |
| `pro-suspended@devisrapide.test` | SUSPENDED | Redirect immédiat `/compte-suspendu`. Pas d'accès au dashboard. |

Pour reseed (état reproductible — wallet remis à 1000€, autoAccept à
false, coords reset Bruxelles) :
```
DATABASE_URL=<preview neon> pnpm tsx scripts/seed-test-pros.ts
```
Le script est idempotent (upsert sur email).

### Préparation

- Les 3 pros ci-dessus en BDD (déjà seedés sur preview).
- Pour voir des leads peuplés côté pro-valid : créer un Lead test via
  `/demande` (Plomberie / URGENT / code postal Bruxelles) ou via le
  protocole SQL du Sprint 2a manual-testing.
- `pnpm dev` + ouvrir `/connexion`.

### Scénario 1 — Auth + middleware

1. Pro non connecté ouvre `/dashboard` → redirect `/connexion?callbackUrl=/dashboard`.
2. Login OK → redirect `/dashboard`.
3. Pro avec `validationStatus = PENDING` (modifier en BDD pour tester) →
   ouvrir `/dashboard` → redirect `/inscription-pro/en-attente`.
4. Pro `SUSPENDED` → redirect `/compte-suspendu`.
5. CLIENT loggé (créer un fake CLIENT user) → ouvrir `/dashboard` →
   redirect `/connexion`.

### Scénario 2 — Tableau de bord (/dashboard)

- 4 cards stats : Crédits / Leads achetés / Leads convertis / Dépensé.
- Vérifier que les counts ce mois sont cohérents avec la BDD.
- Delta % : si pas d'historique mois précédent → "Nouveau" (pas
  "+Infinity%").
- Section "Leads disponibles pour vous" : 5 leads max, tabs catégorie
  dynamiques.
- Widget Auto-accept : toggle change le ProProfile.autoAccept en BDD,
  toast feedback.
- Widget Portée : palier courant highlight.
- Widget Catégories : pills des ProCategory du pro.
- Activité récente : merge LeadAssignment + WalletTransaction triés.
- Conseils : 3 cards statiques.

### Scénario 3 — Leads disponibles (/dashboard/leads)

- Liste paginée 20/page.
- Tabs catégorie dynamiques.
- Empty state si 0 PENDING.

### Scénario 4 — Détail lead + accept/refuse

1. Cliquer "Acheter le lead" sur une card → /dashboard/leads/[id].
2. Vérifier : coords masquées (prénom + initiale), description, section
   paiement (solde / prix / solde après).
3. Si solde insuffisant : bouton Acheter disabled + warning rose.
4. Refuser : modal s'ouvre, champ reason optionnel, confirmer →
   assignment REFUSED, redirect /dashboard/leads.
5. Accepter (solde OK) : transaction wallet, redirect
   /dashboard/mes-demandes/[id], assignment ACCEPTED.

### Scénario 5 — Mes demandes + qualification

- /dashboard/mes-demandes : liste ACCEPTED, tabs followupStatus.
- Détail : coords complètes, CTAs tel: + mailto:, section qualif avec
  3 boutons (CONVERTED / NO_FOLLOWUP / NOT_REACHABLE).
- Cliquer un statut → update + router.refresh, statut highlight change.

### Scénario 6 — Wallet (/dashboard/wallet)

- Card top : solde + crédit count.
- CTA "Recharger" disabled + tooltip "Bientôt disponible".
- Tab Historique : table transactions paginée.
- Tab Packs : 3 cards Découverte / Boost / Domination depuis
  AppConfig.WALLET_PACKS. Badge "Populaire" sur Boost. Boutons disabled.

### Scénario 7 — Profil (/dashboard/profil)

- Section Identité : modifier companyName + tel + email + VAT,
  Enregistrer → toast.
- Conflit email/VAT : essayer un email/VAT déjà pris → erreur claire
  (sans casser le formulaire).
- Section Métiers : retirer une cat (pill X), erreur si dernière. Modal
  Ajouter : multi-select grouped by Universe, save.
- Section Zone : changer code postal + radius, vérif lat/lng recalculé
  en BDD.
- Section Auto-accept : toggle synchronisé avec le widget du dashboard.
- Section Sécurité : modal change password (current + new + confirm),
  rules 8 char + 1 maj + 1 chiffre.

### Sortie attendue Sprint 2b

- `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` : zéro erreur.
- 7 pages dashboard accessibles, navigation Sidebar OK, active state
  correct (sous-pages /dashboard/leads/[id] highlight "Leads
  disponibles").
- Toutes les Server Actions retournent ActionResult avec error code
  typé + toast feedback côté Client.
- requireProSession() throw UnauthorizedError pour les non-VALIDATED
  + Server Actions retournent code UNAUTHORIZED.
- loading.tsx + error.tsx route-level présents.
- Aucune touche aux pages publiques ni au backend Sprint 2a.
