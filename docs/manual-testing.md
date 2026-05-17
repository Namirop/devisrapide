# Tests manuels — DevisRapide

Document évolutif. Une section par sprint. À dérouler avant chaque merge vers `dev`.

---

## Sprint Design Refactor — scénarios de test

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

---

## Sprint 2a — Matching + lifecycle backend

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

## Sprint 3 — Wallet Stripe (recharge)

### Préparation

- Variables d'env présentes en plus du baseline :
  - `STRIPE_SECRET_KEY=sk_test_xxx` (clef test du compte Stripe en dev)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx`
  - `STRIPE_WEBHOOK_SECRET=whsec_xxx` (généré par Stripe CLI au listen,
    cf. setup ci-dessous)
- Migration appliquée : `pnpm db:deploy` (table `StripeWebhookEvent` +
  colonne `WalletTransaction.stripeCheckoutSessionId`).
- Démarrer le dev server : `pnpm dev` sur `http://localhost:3000`.

### Setup Stripe CLI (obligatoire en dev local)

Sans Stripe CLI, le webhook Stripe n'atteindra pas localhost — l'endpoint
ne sera jamais appelé et le wallet ne sera pas crédité.

```bash
# Install (macOS) :
brew install stripe/stripe-cli/stripe
# Autres OS : cf. https://stripe.com/docs/stripe-cli

# Auth (ouvre le navigateur pour pairing) :
stripe login

# Forward des webhooks vers le dev server :
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

La commande `stripe listen` affiche un secret temporaire de la forme
`whsec_xxxxxxxxxxxxxxxxxxxx` — copier dans `.env.local` comme valeur de
`STRIPE_WEBHOOK_SECRET`, redémarrer `pnpm dev`. Le secret CLI change à
chaque session ; pas un secret stable.

> **Sprint 6 Launch** : configurer un vrai endpoint webhook côté Stripe
> dashboard (`https://devisrapide.be/api/stripe/webhook`) + récupérer le
> `whsec_xxx` permanent + l'ajouter aux env vars Vercel Production. Pas
> fait en Sprint 3, car on bosse en local uniquement.

### Cartes test Stripe (mode test)

- `4242 4242 4242 4242` → paiement réussi
- `4000 0000 0000 9995` → décliné (insufficient funds)
- `4000 0027 6000 3184` → 3DS authentification required
- Date d'expiration : n'importe quoi dans le futur (ex `12/30`)
- CVC : n'importe quoi à 3 chiffres (ex `123`)
- Code postal : n'importe quoi (ex `1000`)

### Scénarios

#### 1. Recharge nominale pack Découverte 70€

1. Se connecter avec un pro VALIDATED (`pnpm db:studio` pour récupérer
   les credentials du seed, ou créer un nouveau via `/inscription-pro`
   puis VALIDATE manuel en BDD).
2. Aller sur `/dashboard/wallet`. Noter le solde initial.
3. Cliquer **Recharger mon wallet** → bascule vers l'onglet "Packs
   disponibles" + scroll vers la grille.
4. Cliquer **Choisir ce pack** sur "Découverte 70 €" → spinner
   "Redirection vers Stripe…" → redirection vers `checkout.stripe.com`.
5. Sur Stripe Checkout : email pré-rempli, montant 70,00 €, locale FR.
6. Carte `4242 4242 4242 4242`, date `12/30`, CVC `123`. Soumettre.
7. Redirection vers `/dashboard/wallet?recharge=success&session_id=cs_...`.
8. Toast vert "Wallet rechargé avec succès" affiché.
9. Solde affiché incrémenté de +70 € (peut prendre 1-3s si webhook
   tarde — le composant `WalletToastFeedback` retrigger un
   `router.refresh()` à 3s pour rattraper).

#### 2. Pack Boost avec bonus

Idem scénario 1 mais sur "Boost 300 € (+50 € bonus)" → solde incrémenté
de +350 €. Vérifier en BDD `WalletTransaction.amountCents = 35000` (et
non 30000).

#### 3. Pack Domination

Idem sur "Domination 800 € (+200 € bonus)" → solde +1000 €.

#### 4. Paiement refusé (insufficient funds)

1. Cliquer **Choisir ce pack** sur n'importe quel pack.
2. Carte `4000 0000 0000 9995`, soumettre.
3. Stripe Checkout affiche une erreur de paiement.
4. Cliquer le bouton "← retour" de Stripe Checkout → redirection vers
   `/dashboard/wallet?recharge=cancelled`.
5. Toast info "Paiement annulé. Aucun montant n'a été débité."
6. Vérifier `walletBalanceCents` inchangé.
7. Vérifier `WalletTransaction` : aucune nouvelle ligne TOPUP.
8. Vérifier `StripeWebhookEvent` : peut contenir une ligne
   `eventType = payment_intent.payment_failed` selon le scénario (logged
   only, pas de credit).

#### 5. Idempotence webhook (Stripe CLI replay)

1. Faire une recharge réussie (scénario 1). Noter l'event ID Stripe
   affiché dans la console CLI : `evt_xxxxxxxxxxxxx`.
2. Re-déclencher le même event :
   ```bash
   stripe events resend evt_xxxxxxxxxxxxx
   ```
3. Vérifier la console dev server : `[stripe/webhook] already processed`.
4. Vérifier en BDD que le solde n'a PAS été crédité 2× et qu'il existe
   bien UNE seule ligne `WalletTransaction` TOPUP avec ce
   `stripePaymentIntentId`.
5. Vérifier que `StripeWebhookEvent.stripeEventId` reste avec UNE seule
   entrée pour cet event (unique constraint a tenu).

#### 6. Webhook signature invalide

```bash
curl -X POST http://localhost:3000/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"checkout.session.completed","id":"evt_fake"}'
```

→ HTTP 400 `Missing signature`. Aucune écriture BDD.

Avec un header `stripe-signature` invalide :

```bash
curl -X POST http://localhost:3000/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=123,v1=fake" \
  -d '{}'
```

→ HTTP 400 `Invalid signature`. Aucune écriture BDD.

### Vérifications BDD post-recharge réussie (`pnpm db:studio`)

- `ProProfile.walletBalanceCents` du pro testé : incrémenté du montant
  exact du pack (avec bonus pour Boost/Domination).
- `WalletTransaction` :
  - 1 nouvelle ligne avec `type = TOPUP`, `amountCents = creditEur × 100`,
    `balanceAfterCents` = nouveau solde, `stripePaymentIntentId = pi_xxx`,
    `stripeCheckoutSessionId = cs_xxx`, `description = "Recharge wallet
— pack <packId>"`.
- `StripeWebhookEvent` :
  - 1 ligne avec `stripeEventId = evt_xxx`, `eventType =
checkout.session.completed`, `payload` JSON complet, `proProfileId`
    du pro testé.

### Vérification email (Resend)

Si `RESEND_API_KEY` configuré : dashboard Resend → onglet "Emails", la
confirmation de recharge doit apparaître avec le bon destinataire et le
bon montant. Cliquer dessus pour visualiser le HTML rendu.

Si `RESEND_API_KEY` absent (dev local sans clef) : la console dev
affiche `[email] RESEND_API_KEY absent — fallback console.` avec le
plain text de l'email. Pas d'envoi réel mais le flow est validé.

### Sortie attendue Sprint 3

- `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` : zéro erreur.
- Recharge end-to-end testée avec les 3 packs (Découverte, Boost,
  Domination) + bonus correct appliqué.
- Carte refusée → no crédit, no email, retour cancelled propre.
- Idempotence : event Stripe replayé 2× = 1 seul crédit.
- Signature invalide → 400 sans écriture BDD.
- Email RechargeConfirmation visible (Resend dashboard ou fallback
  console selon config).
- Aucun fichier hors périmètre touché (matching, débit lead Sprint 2a,
  pages publiques, admin Sprint 4).

## Sprint 4 — Panel admin

### Pré-requis

- Variables d'env baseline + Stripe Sprint 3 OK.
- Un compte admin existe (créé par seed ou via SQL direct sur Neon avec
  `UPDATE "User" SET role='ADMIN' WHERE email='admin@devisrapide.be'`).
- Migration appliquée : `pnpm db:deploy` (colonnes
  `ProProfile.suspensionReason`, `LeadAssignment.adminGifted`,
  `LeadAssignment.adminGiftedBy`).
- Au moins 1 pro PENDING + 1 pro VALIDATED + 1 lead en BDD pour les
  tests visuels (sinon les listes sont vides).

### Scénarios

#### 1. Garde middleware — anon redirigé vers /connexion

1. Logout (effacer cookie de session).
2. Aller sur `http://localhost:3000/admin`.
3. Attendu : redirection vers `/connexion?callbackUrl=%2Fadmin`.
4. Variante : `/admin/leads?status=souffrance` → callbackUrl encode
   bien le full path + query.

#### 2. Garde middleware — pro non-admin reçoit un 404 silencieux

**Test critique (sécurité).**

1. Se connecter avec un pro VALIDATED standard (rôle `PRO`).
2. Naviguer directement vers `http://localhost:3000/admin/leads`.
3. Attendu côté UI : page 404 standard de Next (404-not-found rewrite).
4. Attendu côté console dev server : un log
   `[proxy/admin] non-admin access attempt` apparaît avec `userId`,
   `role=PRO`, `attemptedPath`, `timestamp`.
5. Tester quelques variantes URL piégeuses :
   - `/admin//evil.com` → bloqué (callback sanitization, mais admin
     est admin → 404 si non-admin, OK si admin)
   - `/admin\\evil` → 404 silencieux pour non-admin.
6. Vérifier qu'AUCUNE donnée admin ne fuit dans la réponse (pas de
   render des pages /admin).

#### 3. Garde middleware — admin accède normalement

1. Se connecter avec un compte admin.
2. `/admin`, `/admin/leads`, `/admin/professionnels`, `/admin/transactions`,
   `/admin/statistiques` → toutes accessibles, stats / listes affichées.
3. Sidebar charcoal #1a1f2e avec accent rouge #dc2626 sur item actif.
4. Aucun log warn `[proxy/admin]` côté serveur.

#### 4. Valider un pro PENDING

1. `/admin/professionnels` → onglet **En attente** → cliquer sur un pro.
2. Sur la page detail, panneau d'action en haut à droite : bouton
   **Valider** (vert).
3. Confirmer → toast "Pro validé" → badge passe de "En attente"
   (orange) à "Validé" (vert).
4. Vérifier en BDD : `validationStatus='VALIDATED'`, `validatedAt`
   renseigné, `rejectedReason` et `suspensionReason` null.
5. Vérifier email : dashboard Resend (ou fallback console
   `[email/sendProValidatedEmail]`) → sujet "Votre compte DevisRapide
   est validé", CTA dashboard.

#### 5. Refuser un pro PENDING

1. Idem mais cliquer **Refuser** → modal avec textarea raison (min 10
   caractères).
2. Soumettre → toast "Pro refusé" → badge "Refusé" (gris).
3. La page detail affiche maintenant une bannière "Raison du refus"
   avec le texte saisi.
4. Vérifier email refusé envoyé avec la raison incluse dans le body.

#### 6. Suspendre un pro VALIDATED

1. Sur un pro VALIDATED, cliquer **Suspendre** → modal raison.
2. Soumettre → badge "Suspendu" (rose), bannière "Raison de la
   suspension" visible.
3. Tentative de connexion côté pro : le proxy/guard doit refuser
   l'accès au /dashboard (cf. requireProSession).
4. Vérifier email suspendu envoyé.

#### 7. Réactiver un pro SUSPENDED ou REJECTED

1. Cliquer **Réactiver** → confirmation simple (pas de raison).
2. Toast "Pro réactivé" → badge "Validé" à nouveau.
3. `rejectedReason` et `suspensionReason` clearées en BDD.
4. Vérifier email réactivé envoyé.
5. Le pro reconnecté accède à nouveau au dashboard.

#### 8. Offrir un lead à un pro (assignLeadGratis)

1. `/admin/leads` → ouvrir un lead PENDING_MATCH ou ASSIGNED.
2. Cliquer **Offrir ce lead à un pro** → modal avec select
   (recherche par nom) + textarea note optionnelle.
3. Sélectionner un pro VALIDATED → soumettre → toast "Lead offert".
4. La page detail liste maintenant un nouvel assignment status
   `ACCEPTED`, `priceCents=0`, badge "Offert par admin".
5. Le lead passe en status `ACCEPTED` (si avant PENDING_MATCH ou
   ASSIGNED).
6. Côté BDD : `LeadAssignment.adminGifted=true`,
   `adminGiftedBy=adminUserId`, `refusalReason` contient la note admin
   si fournie.
7. Vérifier email LeadGiftedPro envoyé au pro avec coordonnées client
   complètes + adminNote affichée dans encart orange si fournie.
8. Tester edge cases :
   - Pro déjà assigné sur ce lead → erreur `ALREADY_ASSIGNED`.
   - Pro non validé → erreur `PRO_NOT_VALIDATED`.
   - Lead EXPIRED ou CANCELLED → erreur `LEAD_EXPIRED`.

#### 9. Ajuster le wallet d'un pro (crédit/débit admin)

1. Sur la page detail d'un pro VALIDATED, cliquer **Ajuster solde**.
2. Modal : choisir Crédit ou Débit, montant (en €), raison (min 10
   caractères).
3. Crédit 50€ → toast → solde +50€. WalletTransaction
   type=`ADMIN_CREDIT`, `description` = raison, `adminActorId` = admin
   connecté.
4. Débit 25€ avec raison → solde -25€. Type=`ADMIN_DEBIT`.
5. Débit supérieur au solde → toast erreur "Solde insuffisant. Solde
   actuel : X€".

#### 10. Modifier le profil pro (admin override)

1. Sur la page detail, cliquer **Modifier le profil**.
2. Modal pré-rempli avec valeurs actuelles. Modifier companyName,
   email, phone, rayon, autoAccept.
3. Soumettre → toast "Profil mis à jour".
4. Vérifier en BDD que SEULS les champs modifiés sont updated (diff
   client-side).
5. Tester conflits unique :
   - Email déjà pris par un autre user → erreur "Cet email est déjà
     utilisé".
   - VAT déjà pris par un autre pro → erreur "Ce numéro TVA est déjà
     utilisé".

#### 11. Liste leads admin — filtres + pagination

1. `/admin/leads` → 6 onglets (Tous, En souffrance, Pending, Assigned,
   Accepted, Completed). Cliquer chacun, vérifier que les badges count
   correspondent à la BDD.
2. **En souffrance** = leads créés depuis > 2h sans assignment ACCEPTED.
   Card border-top rouge sur le dashboard home si count > 0.
3. Pagination 30/page : tester sur > 30 leads. Caret navigation OK.
4. Cliquer sur un lead → page detail avec toutes les infos + table
   des assignments.

#### 12. Liste pros admin — filtres + pagination

1. `/admin/professionnels` → 5 onglets (Tous, En attente, Validés,
   Suspendus, Refusés). Counts cohérents.
2. **En attente** : card orange sur le dashboard home si count > 0.
3. Pagination 30/page.

#### 13. Transactions globales

1. `/admin/transactions` → 6 onglets type (Toutes, Recharges, Achats
   leads, Crédits admin, Débits admin, Remboursements).
2. Filtre via querystring `?type=recharges` → URL bookmarkable.
3. Pagination 50/page.
4. Lien sur le nom du pro → redirige vers /admin/professionnels/[id].

#### 14. Statistiques V1

1. `/admin/statistiques` → AdminStatsStrip avec 4 KPI (CA mois,
   Wallet global, Leads mois, Leads en souffrance).
2. Delta % vs mois précédent affiché sur CA et Leads mois.
3. Block "Pros par statut" : count + % par status.
4. Block "Taux d'acceptation" : ratio assignments ACCEPTED / total.
5. Top 5 catégories + Top 5 villes.

### Vérifications croisées Sprint 4

- Toutes les actions admin écrivent un log si erreur (`console.error`
  avec contexte).
- Action `adjustWalletBalance` : transaction Prisma atomique (FOR
  UPDATE implicite via $transaction), pas de race-condition.
- Aucune action admin ne casse les guards pro standards : un pro
  refusé ne peut plus se connecter au dashboard pro même si l'admin
  n'a pas explicitement bloqué son User.

### Sortie attendue Sprint 4

- `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` : zéro erreur.
- Garde middleware testée : anon → /connexion redirect, pro non-admin
  → 404 + warn log, admin → accès normal.
- Pro lifecycle complet : validate/reject/suspend/reactivate + emails
  envoyés à chaque transition.
- Lead offert end-to-end : assignment ACCEPTED + 0€ + email pro avec
  adminNote.
- Wallet ajustement : crédit/débit + WalletTransaction tracée +
  adminActorId renseigné.
- Update profil admin override : diff client + conflits unique
  gérés.
- Stats Strip et page /admin/statistiques cohérentes avec la BDD.

---

## Sprint 5c — Polish prod (Sentry + Turnstile + CSP + Vitest)

### Sentry

#### Captures côté serveur

1. Trigger volontaire une exception dans une action admin (ex: ajouter `throw new Error("test sentry")` temporairement dans `validateProProfile`).
2. Run l'action depuis `/admin/professionnels/[id]`.
3. Vérifier dashboard sentry.io : nouvelle erreur reçue avec tags `{action: "PRO_VALIDATED", targetType: "ProProfile"}` et extra `{actorId, targetId}`.
4. Retirer le throw test.

#### PII scrubbing

1. Trigger une exception dans une action qui logge email/password dans extra.
2. Vérifier dans le dashboard Sentry que ces champs apparaissent comme `[REDACTED]`.

#### Mode sans DSN

1. Vider `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` dans `.env.local`.
2. `pnpm dev` : aucune erreur au boot, app fonctionne normalement.
3. `Sentry.captureException` est appelé mais ne fait rien (no network).

### Turnstile

#### Wizard /demande (Step 6 Contact)

1. Step 6 : widget Cloudflare apparaît en bas du formulaire.
2. Submit sans widget chargé : erreur "Vérification de sécurité requise" sur turnstileToken.
3. Submit avec widget résolu : `createLead` vérifie le token Cloudflare, succès → confirmation.
4. Token invalide (DevTools modifier la valeur) : `code: "TURNSTILE_FAILED"`, toast.

#### Wizard /inscription-pro (Step 4 Confirmation) + Form /connexion

1. Widget Turnstile visible en bas de Step 4 / form login.
2. Token invalide → Server Action rejette (TURNSTILE_FAILED pour signup, CredentialsSignin générique pour login).

#### Mode dev sans keys

1. Vider `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` dans `.env.local`.
2. Recharger les forms : widget utilise sitekey test `1x00000000000000000000AA` (always-pass).
3. Server-side : `verifyTurnstileToken` retourne `success: true` peu importe le token (mode dev).
4. Flow complet fonctionne sans Cloudflare configuré.

### Cookies banner

1. Visite incognito sur `/` : après 800ms, banner navy en bas avec bouton "J'ai compris".
2. Clic : banner disparaît, `localStorage.cookies-acknowledged = "1"`.
3. Refresh : banner ne réapparaît plus.

### CSP headers

1. DevTools Network sur `/`. Inspecter `Content-Security-Policy` du document HTML.
2. Vérifier directives includent les allowlists Cloudflare/Stripe/Sentry.
3. Tester wallet → Stripe Checkout passe (frame-src OK).
4. Tester /demande Step 6 → widget Turnstile charge (script-src + frame-src CF OK).
5. Console browser : aucune violation CSP.

### Stripe webhook validation montant

1. Créer une session Checkout avec un pack valide (ex: `decouverte` = 70€).
2. Compléter le paiement → WalletTransaction credit = 7000 cents.
3. Test manipulation : modifier `creditAmountCents` dans Stripe metadata, retrigger l'event webhook.
4. Vérifier Sentry : warning "Stripe webhook amount mismatch" + return 200 sans crédit.

### Vitest

```bash
pnpm test
# Expected: Test Files 4 passed (4), Tests 41 passed (41)
```

### Sortie attendue Sprint 5c

- `pnpm lint` : 0 errors, 0 warnings
- `pnpm tsc --noEmit` : OK
- `pnpm build` : OK
- `pnpm test` : 41/41 verts
- Headers DevTools : CSP + X-Frame-Options + HSTS + autres présents
- Turnstile fonctionnel sur les 3 formulaires
- CookiesBanner s'affiche au premier visit + mémoire localStorage
- Sentry capture testée manuellement (throw volontaire + check sentry.io)
- Stripe webhook amount mismatch → warning Sentry sans crédit

---

## Sprint 5.5 — PWA + Push notifications

Tests focalises sur les pros (cible PWA). Aucun test cote particulier
(/demande), la PWA n'est pas exposee aux clients.

### Pre-requis

1. Generer + placer les VAPID keys dans `.env.local` :
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public>
   VAPID_PRIVATE_KEY=<private>
   VAPID_SUBJECT=mailto:contact@devisrapide.be
   ```
2. Pour tester le service worker en local : `NEXT_PUBLIC_SW_DEV=1` dans
   `.env.local` (sinon SW desactive en dev pour ne pas casser le HMR).
3. `pnpm build && pnpm start` pour avoir l'enregistrement SW (en dev
   meme avec SW_DEV=1, certains navigateurs filtrent : prod build OK
   pour test serieux).

### Installation PWA

#### Android Chrome / Edge desktop

1. Connecte en tant que pro VALIDATED, sur `/dashboard`.
2. Banniere "Installez DevisRapide sur votre appareil" + bouton
   "Installer" visible (declenche par event `beforeinstallprompt`).
3. Clic "Installer" → prompt natif Chrome → "Installer".
4. App standalone, l'icone DevisRapide apparait sur l'ecran d'accueil
   (Android) / app launcher (desktop).
5. Re-ouvrir l'app : start_url=/dashboard → atterrit direct dashboard
   sans header navigateur.

#### iOS Safari

1. Sur iPhone, ouvrir `/dashboard` en Safari (Chrome iOS pas supporte
   pour install PWA).
2. Banniere DevisRapide avec instructions "Sur iOS : appuyez sur
   [icone partage] puis Sur l'ecran d'accueil" — iOS n'expose pas
   l'event `beforeinstallprompt`, le pro doit installer manuellement.
3. Bouton Partage Safari → "Sur l'ecran d'accueil" → OK.
4. Tap sur l'icone DevisRapide depuis l'ecran d'accueil : se lance
   standalone (sans barre Safari, juste status bar systeme).

#### Verifier dismiss persistant

1. Cliquer X sur la banniere → disparait.
2. Refresh : ne reapparait plus (`localStorage.pwa-install-dismissed = "1"`).

### Notifications push

#### Activer

1. Sur `/dashboard/profil`, section "Notifications" : voir
   `PushSubscriptionManager`.
2. Permission etat "default" → bouton "Activer les notifications".
3. Clic → prompt navigateur "DevisRapide souhaite afficher des
   notifications" → Autoriser.
4. Etat passe a "granted + activees", toast "Notifications activees".
5. Section "Appareils enregistres" affiche 1 entree avec userAgent
   lisible (Chrome desktop / iPhone Safari / etc.) + date d'ajout.

#### Verifier la BDD

```sql
SELECT id, "proProfileId", "userAgent", "createdAt"
FROM "PushSubscription"
WHERE "proProfileId" = '<id du pro test>';
```
- 1 ligne par appareil enregistre.

#### Desactiver

1. Sur le device courant, bouton "Desactiver sur cet appareil".
2. Toast "Notifications desactivees sur cet appareil".
3. La PushSubscription correspondante est supprimee de la BDD.
4. Activer un autre appareil (ordi different) : 2 PushSubscription
   distinctes en BDD. Retirer 1 device → l'autre survit.

### Tests des 5 events

Pre-requis : pro VALIDATED avec push active sur au moins 1 device.

#### Event 1 — Nouveau lead

1. Cote client (incognito) : `/demande` → completer wizard avec une
   categorie + ville couverte par le pro test.
2. Submit. Cote pro : push instantane sur l'appareil enregistre
   "Nouveau lead disponible — {Categorie} a {Ville} — XXX€".
3. Tap sur la notif → ouvre `/dashboard/leads`.

#### Event 2 — Wallet faible

1. Cote admin : `/admin/professionnels/{proId}` → action "Debit
   manuel" pour ramener le wallet juste au-dessus de 50€ (ex: 60€).
2. Cote client : creer un lead qui match le pro avec un prix qui
   fera passer en dessous de 50€ (ex: 15€ → solde apres = 45€).
3. Pro accepte le lead → push "Solde wallet faible — Votre solde est
   de 45€" sur tous les devices.
4. Re-accepter un autre lead qui descend a 30€ → PAS de 2eme push
   (franchissement deja fait, condition balanceBefore >= 50€ KO).

#### Event 3 — Pro lifecycle

Pour chaque action admin sur `/admin/professionnels/{proId}` :
- "Valider" → push "Compte valide"
- "Refuser" (pro PENDING) → push "Candidature non retenue"
- "Suspendre" (pro VALIDATED) → push "Compte suspendu"
- "Reactiver" (pro SUSPENDED) → push "Compte reactive"

Le tag `pro-lifecycle-{proId}` fait que la 2e notif remplace la 1ere
dans le tray (pas d'empilement).

#### Event 4 — Lead offert

1. Admin : `/admin/leads/{leadId}` → action "Offrir a un pro" →
   selectionner un pro VALIDATED.
2. Pro recoit push "Lead offert — L'equipe DevisRapide vous a offert
   un lead : {Categorie} a {Ville}.".

#### Event 5 — Lead bientot expire

1. Setup : creer un lead avec un assignment PENDING. Modifier en BDD
   `expiresAt` pour le mettre dans <30 min (ex: now + 20 min) et
   `expiryNotifiedAt = NULL`.
2. Trigger cron manuellement :
   ```
   curl -H "Authorization: Bearer $CRON_SECRET" \
     http://localhost:3000/api/cron/process-leads
   ```
3. Push "Lead bientot expire — Un lead {Categorie} a {Ville} expire
   bientot." envoye au pro.
4. Re-trigger cron immediatement : aucun nouveau push (flag
   `expiryNotifiedAt` desormais set).

### Resilience

#### Sans VAPID keys (dev local)

1. Vider `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` dans
   `.env.local`.
2. Tous les flows ci-dessus fonctionnent toujours (creation lead OK,
   debit wallet OK, actions admin OK). Les push sont silencieusement
   no-op cote serveur (early return `vapidConfigured = false`).
3. Cote client, l'activation push echoue avec toast "VAPID public key
   non configuree" — c'est attendu et n'altere pas le reste de l'UI.

#### Subscription revoquee (dead)

1. Activer push sur Chrome, recuperer son endpoint en BDD.
2. Manuellement, dans Chrome : Settings → Privacy → Site settings →
   Notifications → Trouver le site → Block.
3. Trigger un event push (ex: creer un lead).
4. Cote serveur : `web-push` retourne 410 Gone → la PushSubscription
   est supprimee automatiquement de la BDD.
5. Verifier en SQL : la row a disparu.

#### notifyByPush master-switch

1. En BDD : `UPDATE "ProProfile" SET "notifyByPush" = false WHERE id = '...'`.
2. Trigger un event (creation lead). Pro ne recoit aucun push.
3. PushSubscription du pro restent en BDD (pas de cleanup, pour
   reactivation sans re-prompter le navigateur).

### Service worker

1. DevTools → Application → Service Workers : `/sw.js` actif et
   controle le scope `/`.
2. DevTools → Network → throttling "Offline" + tap sur
   `/dashboard/leads` → page `offline.html` s'affiche avec branding DS.
3. Notification depuis Application → Service Workers → "Push" →
   payload `{"title":"test","body":"hello","url":"/dashboard"}` →
   notification apparait, tap → focus la fenetre dashboard ou en
   ouvre une.

### Sortie attendue Sprint 5.5

- `pnpm lint` : 0 errors
- `pnpm tsc --noEmit` : OK
- `pnpm build` : OK
- `pnpm test` : 41/41 verts (Sprint 5c intacts)
- `/manifest.webmanifest` servi, icones presentes dans `public/icons/`
- SW enregistre en prod
- Section Notifications visible dans `/dashboard/profil`
- Banniere install visible dans `/dashboard` (Android natif + iOS
  instructions selon device)
- 5 events declenchent un push au pro concerne, sans casser les
  actions metier en cas d'echec push

---

## Astuces locales

### Tester `pnpm start` (mode prod) en local

Sur `pnpm dev`, Auth.js v5 auto-trust l'host. Sur Vercel, idem via
`VERCEL_URL`. Mais sur `pnpm start` en local, Auth.js v5 leve une
erreur `UntrustedHost` sur `/api/auth/session` et toutes les pages
protegees (dashboard, admin) renvoient 500.

**Fix** : ajouter dans `.env.local` :

```
AUTH_TRUST_HOST=true
```

Puis relancer `pnpm start`. C'est uniquement pour le local — Vercel
s'en passe (auto-trust). Ne pas committer en prod self-hosted sans
reverse proxy verifie (host-header injection sinon).
