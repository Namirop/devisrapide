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
