# DevisRapide — Document d'architecture

Document de référence consolidé suite à la session d'architecture.
**Statut :** validé, prêt pour démarrage Sprint 0.
**Audience :** Romain Maes (dev) + Kamel (client) + Claude Code (agent dev).

---

## 1. Contexte projet

### 1.1 Description

DevisRapide est une plateforme web qui met en relation des particuliers avec des professionnels (artisans, services, rénovation) via des demandes de devis. Modèle pay-per-lead avec wallet rechargeable côté pro.

### 1.2 Acteurs

- **Client** : particulier qui soumet une demande de devis (pas de compte authentifié au MVP, juste un formulaire avec email).
- **Pro** : artisan ou prestataire qui paie pour recevoir des leads qualifiés. Compte authentifié, wallet rechargeable via Stripe.
- **Admin** : Kamel, gère validation des pros, configuration des prix, crédits manuels, audit.

### 1.3 Contraintes projet

- **Délai** : 2 semaines de dev focus (15 jours).
- **Budget** : 2000€ HT (acompte 50% versé).
- **Stack imposée** : Next.js 16 + TypeScript + Tailwind v4 + Prisma + PostgreSQL + Auth.js v5 + Stripe + Resend.
- **Pas de stack mobile native** : tout en PWA installable.
- **Hébergement** : Vercel (Pro) + Neon (Postgres).

---

## 2. Stack et services

### 2.1 Stack technique

| Couche | Techno |
|---|---|
| Framework | Next.js 16 (App Router) |
| Langage | TypeScript strict |
| UI | Tailwind v4 + shadcn/ui |
| BDD | PostgreSQL (Neon) |
| ORM | Prisma |
| Auth | Auth.js v5 (NextAuth) + Prisma adapter |
| Paiements | Stripe (Checkout + Customer + Webhook) |
| Emails | Resend + React Email templates |
| Push | web-push (lib npm) + VAPID + Service Worker custom |
| Validation | Zod |
| Rate limiting | Upstash Ratelimit (Redis) |
| Monitoring | Sentry |
| Hébergement | Vercel Pro |
| Cron | Vercel Cron |
| Géocodage | JSON statique GeoNames (codes postaux belges + lat/lng, embarqué) |
| Anti-spam | Cloudflare Turnstile (captcha invisible) |

### 2.2 Services SaaS et coûts

| Service | Plan | Coût mensuel |
|---|---|---|
| Vercel | Pro | 20$ |
| Neon | Free → Launch tier | 0$ → 19$ |
| Stripe | Standard | 1.5% + 0.25€/tx |
| Resend | Free (3k emails/mois) | 0$ |
| Upstash | Free (10k req/jour) | 0$ |
| Sentry | Free (5k events/mois) | 0$ |
| Turnstile (Cloudflare) | Free | 0$ |
| GeoNames JSON BE | embarqué (asset statique) | 0$ |

**Total launch** : ~20$/mois. Marge sur le forfait hébergement Kamel (60€/mois) : ~40€.

---

## 3. Modèle économique et règles métier

### 3.1 Catégorisation à 3 niveaux

Catalogue actuel (`prisma/seed.ts`) : **6 univers / 24 catégories / 61 sous-catégories**, aligné sur la liste métier validée avec Kamel.

- **Niveau 1 — Univers** : 6 univers.
  - **Gros œuvre & Toiture** (`gros-oeuvre-toiture`) — Toiture, Maçonnerie, Façade, Châssis.
  - **Techniques & Énergie** (`techniques-energie`) — Chauffage, Climatisation, Électricité, Plomberie, Énergie.
  - **Rénovation & Intérieur** (`renovation-interieur`) — Rénovation intérieure, Cuisine, Salle de bain, Menuiserie intérieure, Peinture, Carrelage, Plafonnage.
  - **Extérieur & Aménagement** (`exterieur-amenagement`) — Aménagement extérieur, Jardin, Piscine & Spa.
  - **Urgence & Services** (`urgence-services`) — Serrurerie, Débouchage & Vidange, Nettoyage, Logistique.
  - **Autre** (`autre`) — wrapper category : 1 cat unique avec sous-cats "Mon projet n'est pas dans la liste" / "Demande multi-travaux".
- **Niveau 2 — Catégorie** : 24 au total (cf. seed). Convention "wrapper category" pour **Autre** (1 cat unique, Step 2 du wizard sera sauté — heuristique `universe.categories.length === 1`, à implémenter Sprint 2 UI).
- **Niveau 3 — Sous-catégorie** : 61 au total. Override prix possible mais non utilisé par défaut.

Les pros s'inscrivent au niveau **Catégorie** (pas Sous-catégorie) pour simplifier l'onboarding.

**Prix par défaut (centimes, à valider avec Kamel)** :
- Lourd `3500 / 8750` : Toiture, Maçonnerie, Façade, Châssis, Énergie, Piscine & Spa.
- Medium `2500 / 6250` : la majorité (Chauffage, Climatisation, Électricité, Plomberie, Cuisine, SDB, Menuiserie int., Aménagement ext., Rénovation intérieure, Autre).
- Light `2000 / 5000` : Peinture, Carrelage, Plafonnage, Jardin, Nettoyage, Logistique.
- Urgence `3000 / 7500` : Serrurerie, Débouchage & Vidange.

### 3.2 Pricing

- Prix configurables par admin via panel.
- Niveau Catégorie : prix par défaut (`defaultSharedLeadPriceCents`, `defaultExclusiveLeadPriceCents`).
- Niveau Sous-catégorie : prix override optionnels (`sharedLeadPriceCents?`, `exclusiveLeadPriceCents?`).
- Fallback : `subCategory.sharedLeadPriceCents ?? category.defaultSharedLeadPriceCents`.
- **Tous les montants stockés en `Int` représentant des centimes**. Pas de Float.
- **Snapshot prix** sur `Lead` à la création et sur `LeadAssignment` à l'assignation. Un changement de prix après n'affecte pas les leads en cours.

> ⚠️ **Phase 4 — Cible non encore en code.** Multiplicateur exclusif : **x2.5** du prix partagé par défaut (au lieu de x2 actuel). Valeur stockée dans `AppConfig` (`EXCLUSIVE_PRICE_MULTIPLIER`), modifiable par l'admin sans redéploiement.

### 3.3 Modes d'attribution

**Lead partagé (par défaut)** : 2-3 pros notifiés, premier(s) accepteur(s) débité(s) au prix lead partagé.

**Lead exclusif** : si un pro est en mode `AUTO_ACCEPT_EXCLUSIVE` et matche, il prend le lead seul (les autres pros ne sont jamais notifiés). Débité au prix exclusif (x2 à x2.5 du partagé). Round-robin via `lastExclusiveLeadAt` quand plusieurs exclusifs sont éligibles.

**Auto-accept standard** : pro reçoit et accepte automatiquement les leads partagés qui matchent. Débit immédiat. Plusieurs pros en standard sur la même zone/catégorie sont tous débités (dans la limite de `MAX_PROS_PER_SHARED_LEAD`).

### 3.4 Matching géographique

- Pro renseigne code postal + rayon d'intervention qu'il accepte (en km).
- Lead matché par catégorie + zone : pro éligible si `haversine(pro, lead) <= min(pro.interventionRadius, lead.currentRadius)`.
- Élargissement automatique du rayon par paliers.
- Si aucun pro à aucun palier : lead expire après `LEAD_GLOBAL_TIMEOUT_HOURS` (24h défaut), email client avec recommandations manuelles.

> ⚠️ **Phase 4 — Cible non encore en code (radii BE) :**
> - Paliers : `[30, 60, OPEN]` km. `OPEN` est représenté par le sentinel `-1` côté DB/code (signifie "toute la zone V1 = Wallonie + Bruxelles francophone, pas de filtre distance").
> - Délais d'élargissement : **2h** entre palier 1 et palier 2, puis **4h** entre palier 2 et `OPEN`. **Aucun délai obligatoire** appliqué après acceptation par un pro — un lead peut être pris dès la première minute.
> - Géocodage du code postal : **JSON statique GeoNames BE** embarqué (codes postaux → lat/lng + commune). Aucun appel réseau au moment de la soumission lead (l'API BAN française est retirée).

### 3.5 Règles wallet

- Recharge via Stripe Checkout (packs prédéfinis — voir ci-dessous).
- Crédit du wallet **uniquement via le webhook Stripe** (jamais via le success_url).
- Idempotence garantie par `stripePaymentIntentId @unique`.
- Débit lead : transaction atomique `Serializable` avec `FOR UPDATE` sur `ProProfile`. Refus si `walletBalanceCents < amount`.
- Crédit/débit manuel admin : raison obligatoire (min 10 caractères), AuditLog systématique, email au pro.
- **Aucun remboursement Stripe automatique**. Litiges gérés via crédit manuel admin.
- **Stripe au nom de Kamel** (compte propriétaire). Romain = prestataire technique, n'apparaît pas dans le flux fonds.

> ⚠️ **Phase 4 — Cible non encore en code (packs BE) :**
>
> | Pack | Prix payé | Crédit wallet | Bonus |
> |---|---|---|---|
> | Découverte | 70 € | 70 € | — |
> | Boost | 300 € | 350 € | +50 € |
> | Domination | 800 € | 1 000 € | +200 € |
>
> Le bonus est crédité automatiquement par le webhook Stripe lors de la confirmation `checkout.session.completed`. Montants configurables via `AppConfig` (`WALLET_PACKS_JSON`).

### 3.6 Confidentialité des données client

Avant acceptation par le pro, visible :
- Univers / Catégorie / Sous-catégorie
- Code postal + commune (pas l'adresse précise)
- Description tronquée à 200 caractères
- Urgence

Après acceptation (débit effectué), accès complet :
- Nom complet, email, téléphone
- Adresse précise
- Description complète

**Règle de sécurité** : les données sensibles ne sont JAMAIS envoyées par le serveur tant que `LeadAssignment.status !== 'ACCEPTED'`. Pas juste cachées en CSS.

### 3.7 Statuts post-acceptation (LeadAssignment)

> ⚠️ **Phase 4 — Cible non encore en code.** Ces statuts seront ajoutés sur `LeadAssignment` pour permettre au pro de qualifier le devenir du lead après acceptation, et à l'admin d'auditer le pipeline.

V1 (BE) prévoit 4 statuts mutuellement exclusifs sur `LeadAssignment` après `ACCEPTED` :

- `PENDING` : pro vient d'accepter, n'a pas encore relancé (statut par défaut post-acceptation).
- `CONVERTED` : le pro a signé un devis / converti le client.
- `NO_FOLLOWUP` : le pro a tenté de joindre le client mais a abandonné (pas d'intérêt confirmé).
- `NOT_REACHABLE` : le pro n'a jamais réussi à joindre le client (mauvais numéro, etc.).

Action admin V1 associée : **"Assigner manuellement et gratuitement"** un lead à un pro précis (bypass du matching auto, débit 0€, AuditLog). Utilisée pour récupérer un lead orphelin ou compenser un pro après incident.

### 3.8 Anti-spam V1

Pas de SMS OTP au launch (coût + friction client). Stratégie défensive en couches :

1. **Honeypot** : champ caché dans le formulaire client, rejet serveur si rempli.
2. **Rate limiting Upstash** : sliding window sur `createLead`, login, push subscribe (déjà décrit §8.2).
3. **Cloudflare Turnstile** : captcha invisible (challenge transparent côté utilisateur, vérification serveur). Active sur `createLead` et `proLogin`. Bypass admin disponible via header signé pour scripts internes.

Si une demande passe les 3 couches, elle est considérée valide. Sentry alerte sur pics anormaux (Sprint 5+).

### 3.9 Belgique — règles spécifiques

> ⚠️ **Phase 4 — Cible non encore en code (résumé regroupé) :**
> - **TVA** : 21 % (taux standard belge). Mention systématique sur factures et CGU.
> - **Identifiant pro (remplace SIRET FR)** : numéro de TVA belge `BE0123456789` (format `BE` + 10 chiffres). Champ Prisma à renommer `vatNumber` (cf §4.2 schéma).
> - **Code postal** : 4 chiffres, regex `^[1-9]\d{3}$`. Range officielle 1000-9999.
> - **Téléphone** : regex acceptant formats BE (`+32 470 12 34 56`, `0470 12 34 56`). Détails Phase 4.
> - **Zone V1** : Wallonie + Bruxelles francophone uniquement. Flandre/Anvers exclus au launch (envoi d'un email "zone non couverte" si code postal hors 1000-1299 / 4000-7999 — bornes Phase 4 à valider avec Kamel).
> - **Plateforme légale** : domiciliée en Belgique. CGU et confidentialité régies par droit belge, juridiction Bruxelles.

---

## 4. Modèle de données

### 4.1 Décisions structurelles

- **Soft delete** uniquement sur `User` et `Lead` (RGPD). Hard delete partout ailleurs (les `Category`, `SubCategory` se désactivent via `isActive` au lieu).
- **Géolocalisation** : `Float` lat/lng + fonction SQL `haversine_km` custom + index sur lat. Pas de PostGIS.
- **Rôles** : table unique `User` avec discriminant `role: ENUM('CLIENT', 'PRO', 'ADMIN')`. Données spécifiques pro dans `ProProfile` (relation 1-1).
- **Argent** : `Int` en centimes, jamais `Float` ni `Decimal`.

### 4.2 Schéma Prisma complet

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── USERS & AUTH ──────────────────────────────────────────

enum UserRole {
  CLIENT
  PRO
  ADMIN
}

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  phone        String?
  firstName    String?
  lastName     String?
  role         UserRole
  passwordHash String?

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  proProfile       ProProfile?
  leadsAsClient    Lead[]              @relation("ClientLeads")
  assignments      LeadAssignment[]    @relation("ProAssignments")
  walletTxs        WalletTransaction[]
  auditLogsAsActor AuditLog[]          @relation("ActorLogs")
  accounts         Account[]
  sessions         Session[]

  @@index([role])
  @@index([deletedAt])
}

// Tables Auth.js v5 standard
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─── PRO PROFILE ───────────────────────────────────────────

enum ProValidationStatus {
  PENDING
  VALIDATED
  REJECTED
  SUSPENDED
}

enum AutoAcceptMode {
  OFF
  STANDARD
  EXCLUSIVE
}

model ProProfile {
  id     String @id @default(cuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  companyName String
  siret       String?
  description String? @db.Text

  validationStatus ProValidationStatus @default(PENDING)
  validatedAt      DateTime?
  rejectedReason   String?

  postalCode           String
  city                 String
  latitude             Float
  longitude            Float
  interventionRadiusKm Int    @default(30)

  walletBalanceCents Int     @default(0)
  stripeCustomerId   String? @unique

  autoAcceptMode      AutoAcceptMode @default(OFF)
  lastExclusiveLeadAt DateTime?
  notifyByEmail       Boolean        @default(true)
  notifyByPush        Boolean        @default(true)

  pushSubscriptions PushSubscription[]
  categories        ProCategory[]
  assignments       LeadAssignment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([validationStatus])
  @@index([latitude])
  @@index([autoAcceptMode, lastExclusiveLeadAt])
}

model ProCategory {
  proProfileId String
  categoryId   String

  proProfile ProProfile @relation(fields: [proProfileId], references: [id], onDelete: Cascade)
  category   Category   @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@id([proProfileId, categoryId])
  @@index([categoryId])
}

model PushSubscription {
  id           String     @id @default(cuid())
  proProfileId String
  proProfile   ProProfile @relation(fields: [proProfileId], references: [id], onDelete: Cascade)

  endpoint  String  @unique
  p256dh    String
  auth      String
  userAgent String?

  createdAt  DateTime @default(now())
  lastUsedAt DateTime @default(now())

  @@index([proProfileId])
}

// ─── CATALOGUE (3 niveaux) ─────────────────────────────────

model Universe {
  id           String  @id @default(cuid())
  name         String  @unique
  slug         String  @unique
  description  String?
  iconName     String?
  displayOrder Int     @default(0)
  isActive     Boolean @default(true)

  categories Category[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Category {
  id         String   @id @default(cuid())
  universeId String
  universe   Universe @relation(fields: [universeId], references: [id], onDelete: Restrict)

  name         String
  slug         String
  description  String?
  isActive     Boolean @default(true)
  displayOrder Int     @default(0)

  defaultSharedLeadPriceCents    Int
  defaultExclusiveLeadPriceCents Int

  subCategories SubCategory[]
  proCategories ProCategory[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([universeId, slug])
  @@index([universeId])
  @@index([isActive])
}

model SubCategory {
  id         String   @id @default(cuid())
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  name         String
  slug         String
  description  String?
  isActive     Boolean @default(true)
  displayOrder Int     @default(0)

  sharedLeadPriceCents    Int?
  exclusiveLeadPriceCents Int?

  leads Lead[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([categoryId, slug])
  @@index([categoryId])
  @@index([isActive])
}

// ─── LEADS ─────────────────────────────────────────────────

enum LeadUrgency {
  URGENT
  SOON
  PLANNED
  FLEXIBLE
}

enum LeadStatus {
  PENDING_MATCH
  ASSIGNED
  ACCEPTED
  COMPLETED
  EXPIRED
  CANCELLED
}

model Lead {
  id     String     @id @default(cuid())
  status LeadStatus @default(PENDING_MATCH)

  clientId String
  client   User   @relation("ClientLeads", fields: [clientId], references: [id])

  clientFirstName String
  clientLastName  String
  clientEmail     String
  clientPhone     String

  subCategoryId String
  subCategory   SubCategory @relation(fields: [subCategoryId], references: [id], onDelete: Restrict)

  description String      @db.Text
  urgency     LeadUrgency

  postalCode String
  city       String
  address    String?
  latitude   Float
  longitude  Float

  isExclusive Boolean @default(false)

  sharedLeadPriceCentsSnapshot    Int
  exclusiveLeadPriceCentsSnapshot Int

  currentRadiusKm Int @default(25)
  matchAttempts   Int @default(0)

  deletedAt DateTime?

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  expiresAt DateTime?

  assignments LeadAssignment[]

  @@index([status])
  @@index([subCategoryId, status])
  @@index([latitude])
  @@index([createdAt])
  @@index([deletedAt])
}

enum AssignmentStatus {
  PENDING
  ACCEPTED
  REFUSED
  EXPIRED
}

model LeadAssignment {
  id           String @id @default(cuid())
  leadId       String
  proProfileId String
  proUserId    String

  lead       Lead       @relation(fields: [leadId], references: [id], onDelete: Cascade)
  proProfile ProProfile @relation(fields: [proProfileId], references: [id], onDelete: Cascade)
  proUser    User       @relation("ProAssignments", fields: [proUserId], references: [id])

  status      AssignmentStatus @default(PENDING)
  isExclusive Boolean          @default(false)
  priceCents  Int

  notifiedAt  DateTime  @default(now())
  respondedAt DateTime?
  expiresAt   DateTime

  walletTransactionId String?            @unique
  walletTransaction   WalletTransaction? @relation(fields: [walletTransactionId], references: [id])

  @@unique([leadId, proProfileId])
  @@index([proProfileId, status])
  @@index([status, expiresAt])
}

// ─── WALLET ────────────────────────────────────────────────

enum WalletTxType {
  TOPUP
  LEAD_DEBIT
  ADMIN_CREDIT
  ADMIN_DEBIT
  REFUND_TO_CREDIT
}

model WalletTransaction {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id])

  type              WalletTxType
  amountCents       Int
  balanceAfterCents Int

  stripePaymentIntentId String? @unique

  leadAssignmentId String?
  assignment       LeadAssignment?

  adminReason  String?
  adminActorId String?

  description String?

  createdAt DateTime @default(now())

  @@index([userId, createdAt])
  @@index([type])
}

// ─── AUDIT LOG ─────────────────────────────────────────────

enum AuditAction {
  PRO_VALIDATED
  PRO_REJECTED
  PRO_SUSPENDED
  PRICE_UPDATED
  CATEGORY_CREATED
  CATEGORY_UPDATED
  CATEGORY_DEACTIVATED
  WALLET_CREDIT_ADDED
  WALLET_DEBIT_ADDED
  LEAD_CANCELLED
  USER_DELETED
}

model AuditLog {
  id      String      @id @default(cuid())
  action  AuditAction
  actorId String
  actor   User        @relation("ActorLogs", fields: [actorId], references: [id])

  targetType String
  targetId   String

  metadata Json?

  createdAt DateTime @default(now())

  @@index([actorId, createdAt])
  @@index([targetType, targetId])
  @@index([action, createdAt])
}

// ─── CONFIG ────────────────────────────────────────────────

model AppConfig {
  key         String   @id
  value       String
  valueType   String
  description String?
  updatedAt   DateTime @updatedAt
  updatedBy   String?
}
```

### 4.3 Fonction SQL haversine

```sql
CREATE OR REPLACE FUNCTION haversine_km(lat1 FLOAT, lng1 FLOAT, lat2 FLOAT, lng2 FLOAT)
RETURNS FLOAT AS $$
  SELECT 6371 * 2 * ASIN(SQRT(
    POWER(SIN(RADIANS(lat2 - lat1) / 2), 2) +
    COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
    POWER(SIN(RADIANS(lng2 - lng1) / 2), 2)
  ));
$$ LANGUAGE SQL IMMUTABLE;
```

À ajouter dans une migration custom après le premier `prisma migrate dev`.

### 4.4 Entrées AppConfig à seeder

| Clé | Type | Défaut | Description |
|---|---|---|---|
| `RADIUS_PALIERS_KM` | json | `[25,50,100]` | Paliers d'élargissement |
| `RESPONSE_DELAY_MINUTES` | int | `120` | Délai de réponse pro |
| `LEAD_GLOBAL_TIMEOUT_HOURS` | int | `24` | Timeout global lead |
| `MAX_PROS_PER_SHARED_LEAD` | int | `3` | Nb max de pros sur lead partagé |
| `EXCLUSIVE_PRICE_MULTIPLIER_DEFAULT` | float | `2.0` | Multiplicateur prix exclusif |

---

## 5. Architecture des routes

### 5.1 Structure du repo

```
src/
├── app/
│   ├── (public)/                      # Pages publiques
│   │   ├── layout.tsx
│   │   ├── page.tsx                   # Landing
│   │   ├── demande/
│   │   │   ├── page.tsx               # Formulaire client multi-step
│   │   │   └── confirmation/page.tsx
│   │   ├── pros/page.tsx              # Landing pro acquisition
│   │   ├── inscription-pro/page.tsx
│   │   ├── connexion/page.tsx
│   │   └── (legal)/
│   │       ├── mentions-legales/page.tsx
│   │       ├── cgu-clients/page.tsx
│   │       ├── cgu-pros/page.tsx
│   │       └── confidentialite/page.tsx
│   │
│   ├── (pro)/                         # Espace pro authentifié
│   │   ├── layout.tsx
│   │   └── pro/
│   │       ├── page.tsx               # Dashboard
│   │       ├── leads/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── wallet/
│   │       │   ├── page.tsx
│   │       │   └── recharger/page.tsx
│   │       └── parametres/
│   │           ├── page.tsx
│   │           └── notifications/page.tsx
│   │
│   ├── (admin)/                       # Espace admin
│   │   ├── layout.tsx
│   │   └── admin/
│   │       ├── page.tsx               # Dashboard KPIs
│   │       ├── pros/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── leads/page.tsx
│   │       ├── catalogue/page.tsx
│   │       ├── wallet/page.tsx
│   │       ├── audit/page.tsx
│   │       └── config/page.tsx
│   │
│   ├── api/                           # Route Handlers
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── stripe/webhook/route.ts
│   │   ├── push/
│   │   │   ├── subscribe/route.ts
│   │   │   └── unsubscribe/route.ts
│   │   ├── geocode/route.ts
│   │   └── cron/
│   │       ├── lead-timeouts/route.ts
│   │       └── admin-digest/route.ts
│   │
│   ├── layout.tsx                     # Root layout
│   ├── globals.css                    # Tailwind v4 + @theme
│   └── manifest.ts                    # PWA manifest
│
├── components/
│   ├── ui/                            # shadcn/ui
│   ├── client-form/
│   ├── pro-dashboard/
│   ├── admin/
│   └── shared/
│
├── lib/
│   ├── auth.ts                        # Config Auth.js v5
│   ├── prisma.ts                      # Singleton Prisma
│   ├── stripe.ts
│   ├── push.ts
│   ├── ratelimit.ts
│   ├── email/
│   │   ├── client.ts
│   │   └── templates/                 # React Email
│   ├── geo/
│   │   ├── ban.ts
│   │   └── haversine.ts
│   ├── matching/
│   │   ├── find-eligible-pros.ts
│   │   ├── assign-lead.ts
│   │   └── expand-radius.ts
│   ├── wallet/
│   │   ├── debit.ts
│   │   └── credit.ts
│   ├── audit/log.ts
│   ├── config.ts                      # Lecture AppConfig (cache)
│   └── utils.ts
│
├── server/
│   ├── actions/
│   │   ├── lead.ts
│   │   ├── assignment.ts
│   │   ├── pro.ts
│   │   ├── wallet.ts
│   │   └── admin/
│   └── queries/
│       ├── pro.ts
│       ├── lead.ts
│       └── stats.ts
│
├── types/
├── schemas/                           # Zod
└── proxy.ts                            # ex middleware.ts (Next 16)

prisma/
├── schema.prisma
├── migrations/
└── seed.ts

public/
├── icons/
├── sw.js
└── pdfs/

docs/
├── architecture.md (ce fichier)
├── conventions.md
├── deployment.md
├── manual-testing.md
└── admin-guide.md
```

### 5.2 Règles de routing

- **Route groups** `(public)`, `(pro)`, `(admin)` pour layout + auth séparés.
- **URLs en français** (`/demande`, `/connexion`).
- **Préfixes `/pro/...` et `/admin/...`** dans l'URL malgré le route group.
- **Pas de sous-domaines** au MVP. Tout sur `devisrapide.fr`.
- **Pas d'espace client authentifié** au MVP.

### 5.3 Proxy (ex middleware)

Next 16 a renommé `middleware.ts` en `proxy.ts` (même rôle, même API). On utilise donc `src/proxy.ts` :
- Routes `/pro/*` : session + role `PRO` + `validationStatus === 'VALIDATED'`. Sinon redirect.
- Routes `/admin/*` : session + role `ADMIN`. Sinon **404** (pas de redirect, on cache l'existence).
- Routes `/api/cron/*` : header `Authorization: Bearer ${CRON_SECRET}`.
- Pro non validé redirigé vers `/inscription-pro/en-attente`.
- Pro suspendu redirigé vers `/compte-suspendu`.

### 5.4 Server Actions vs Route Handlers

**Server Actions** (`src/server/actions/`) pour : mutations user-driven, soumissions formulaires, actions admin.

**Route Handlers** (`app/api/`) pour : webhooks externes (Stripe), cron jobs, endpoints service worker (push subscribe), proxies API externes.

Règle : si appelé par un humain → Server Action. Si appelé par une machine → Route Handler.

### 5.5 Conventions structure

- `src/lib/` = code métier réutilisable, **aucun JSX, aucun React**.
- `src/server/actions/` = wrappers fins (validation Zod + auth check + appel `lib/`).
- `src/server/queries/` = queries serveur réutilisables.
- `src/components/ui/` = shadcn/ui uniquement.
- `src/components/[feature]/` = composants par feature, pas par type.
- `'use client'` placé le plus bas possible dans l'arbre.

---

## 6. Flows utilisateurs

### 6.1 Création de lead client

1. Multi-step wizard Client Component (6 étapes : univers → catégorie → sous-catégorie → description+urgence → localisation → coordonnées).
2. Submit → Server Action `createLead` :
   - Validation Zod
   - Géocodage BAN (postal → lat/lng)
   - Upsert User par email (role CLIENT)
   - Create Lead `PENDING_MATCH` avec snapshot prix
   - Trigger `matchLead()` synchrone
   - Email "Demande reçue"
   - Redirect `/demande/confirmation`
3. Si aucun pro à 25km : reste en `PENDING_MATCH`, le cron prendra le relais.

### 6.2 Matching et attribution

```
matchLead(leadId):
  1. Chercher pro EXCLUSIVE éligible (round-robin) → si trouvé : attribution exclusive immédiate
  2. Sinon, chercher pros STANDARD/OFF (jusqu'à MAX_PROS_PER_SHARED_LEAD)
  3. Pour chaque pro :
     - Mode STANDARD → LeadAssignment ACCEPTED + débit immédiat
     - Mode OFF → LeadAssignment PENDING + notif push + email
  4. Update Lead.status = ASSIGNED (ou ACCEPTED si auto-accept)
```

### 6.3 Acceptation/refus pro

Server Action `acceptAssignment(id)` — transaction `Serializable` avec lock `FOR UPDATE` :
1. Lock ProProfile
2. Vérifier assignment.status === PENDING + non expiré
3. Vérifier balance suffisante
4. Update assignment ACCEPTED
5. Create WalletTransaction LEAD_DEBIT
6. Update wallet
7. Update Lead ACCEPTED si premier accept

Server Action `refuseAssignment(id)` — simple update status REFUSED.

### 6.4 Recharge wallet Stripe

1. Pro choisit pack (30/50/100/200€)
2. Server Action `createCheckoutSession` → URL Stripe
3. Pro paie sur Stripe
4. Webhook `/api/stripe/webhook` :
   - Vérifier signature
   - Idempotence par `stripePaymentIntentId @unique`
   - Transaction : create WalletTransaction TOPUP + update wallet
5. Pro redirigé sur `/pro/wallet`

**Le crédit se fait UNIQUEMENT via le webhook**, jamais via le success_url.

### 6.5 Cron timeouts et élargissement

`/api/cron/lead-timeouts` toutes les 5 min :
1. Marquer LeadAssignments expirés (status PENDING + expiresAt < now)
2. Pour chaque Lead concerné sans accept :
   - Si Lead.expiresAt < now → status EXPIRED + email client recommandations
   - Sinon élargir au palier suivant et relancer matchLead
   - Si plus de palier disponible → status EXPIRED

### 6.6 Admin

- Validation pro : update status + AuditLog + email pro
- Crédit/débit manuel : transaction + AuditLog + email pro (raison min 10 chars)
- Update pricing : AuditLog avec metadata before/after, pas d'effet rétroactif sur les leads existants

### 6.7 State machine Lead

```
PENDING_MATCH ──→ ASSIGNED ──→ ACCEPTED ──→ COMPLETED
       │             │            │
       │             ↓            │
       │          EXPIRED         │
       │                          │
       └──→ EXPIRED               └──→ CANCELLED
```

Helper `assertLeadTransition(currentStatus, newStatus)` qui throw si invalide.

---

## 7. Real-time, cron, monitoring

### 7.1 Real-time

Polling SWR toutes les 30s sur dashboard pro. Pas de SSE/WebSocket.

```typescript
const { data: leads } = useSWR('/api/pro/active-leads', fetcher, {
  refreshInterval: 30000,
  revalidateOnFocus: true,
})
```

### 7.2 Cron Vercel

`vercel.json` :
```json
{
  "crons": [
    { "path": "/api/cron/lead-timeouts", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/admin-digest", "schedule": "0 9 * * *" }
  ]
}
```

Auth via header `Authorization: Bearer ${CRON_SECRET}` (Vercel injecte automatiquement).

### 7.3 Monitoring Sentry

Activé au Sprint 5. Capture auto des exceptions client + serveur. `Sentry.captureMessage` manuel pour les warnings métier (webhook PaymentIntent inconnu, pro accepte lead expiré, cron qui foire). Ne pas capturer les erreurs Zod (input invalide = normal).

---

## 8. Sécurité

### 8.1 Headers

```typescript
// next.config.ts
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    ],
  }]
}
```

### 8.2 Rate limiting (Upstash)

| Endpoint | Limite |
|---|---|
| `createLead` | 5 / IP / heure |
| Login pro | 10 / IP / 15 min |
| Push subscribe | 20 / IP / heure |

### 8.3 Validation Zod

Sur 100% des inputs : Server Actions, Route Handlers, params URL. Schémas centralisés dans `src/schemas/`.

### 8.4 Échappement

- Échappement HTML systématique dans les emails (description du lead notamment)
- Pas de logs PII (juste IDs)
- `.env.local` dans `.gitignore` AVANT le premier commit

### 8.5 Webhook Stripe

- Vérification signature obligatoire (`stripe.webhooks.constructEvent`)
- Body raw via `req.text()` (pas JSON parsé)
- Idempotence par `stripePaymentIntentId @unique`

### 8.6 Données sensibles

Les infos client (nom, téléphone, adresse précise) ne sont **jamais envoyées** par le serveur tant que `LeadAssignment.status !== 'ACCEPTED'`. Pas juste cachées en CSS.

---

## 9. Emails (Resend)

### 9.1 Templates à créer

**Côté client :**
1. Demande reçue (création lead)
2. Pro a accepté votre demande
3. Aucun pro disponible (lead expiré)

**Côté pro :**
4. Inscription : compte en attente
5. Compte validé
6. Compte rejeté (avec raison)
7. Nouveau lead disponible
8. Lead accepté automatiquement
9. Wallet rechargé (confirmation Stripe)
10. Wallet crédité manuellement par admin

**Côté admin (Kamel) :**
11. Digest quotidien 9h : pros à valider

### 9.2 Configuration

- `from: noreply@devisrapide.fr` (DNS Resend à configurer DKIM/SPF)
- `reply-to: contact@devisrapide.fr`
- Templates en React Email (typés, prévisualisables `react-email dev`)

---

## 10. PWA et Push

### 10.1 Manifest

`app/manifest.ts` : nom, icônes 192/512, theme color, `display: 'standalone'`.

### 10.2 Service Worker

`public/sw.js` minimal :
- `push` event handler
- `notificationclick` handler
- Pas de cache offline-first au MVP

### 10.3 Web Push

- VAPID keys générées via `web-push generate-vapid-keys`
- Variables : `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- Lib `web-push` côté serveur, gestion 410 Gone (suppression endpoint expiré)

### 10.4 Install prompt

Composant `InstallPrompt` :
- Android Chrome : `beforeinstallprompt` event natif
- iOS Safari : tuto visuel "Partager → Sur l'écran d'accueil"
- Affiché tant que `pushSubscriptions.length === 0`

**iOS limitation** : Web Push fonctionne uniquement si PWA installée sur écran d'accueil (iOS 16.4+). Email reste fallback obligatoire.

---

## 11. Conventions de code

### 11.1 TypeScript

- Strict mode activé
- Zéro `any`, zéro `as any` douteux
- Discriminated unions pour les variants
- Type guards quand pertinent
- Inférence privilégiée

### 11.2 React / Next.js 16

- Server Components par défaut
- `'use client'` uniquement quand nécessaire, placé le plus bas possible
- Pattern client island : Server wrapper + Client minimal
- `generateStaticParams` + `generateMetadata` pour routes dynamiques

### 11.3 Tailwind v4

- Tailwind v4 partout
- Design tokens dans `@theme inline`
- Utilities custom via `@utility`
- `@layer components` pour les classes ponts
- Pas d'inline styles sauf dynamiques

### 11.4 Conventional Commits

- `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `perf:`, `a11y:`, `security:`
- Scope pertinent : `feat(matching): ...`

### 11.5 Bonnes pratiques

- Pas de `console.log` en prod
- Pas de TODO/FIXME orphelins
- Pas de dead code
- Variables d'env dans `.env.local`, jamais dans le code
- `.env.local.example` à jour
- Pas de secrets hardcodés
- Validation Zod côté serveur systématique

### 11.6 Format du code

- Composants modulaires : 1 composant / fichier, dossier par feature
- Imports organisés : externes → internes `@/` → types
- Pas de fichiers > 500 lignes
- Commentaires uniquement sur décisions techniques non évidentes
- Noms explicites, pas d'abréviations cryptiques
- Fonctions pures quand possible
- Types exportés depuis fichier dédié si partagés

---

## 12. Tests

**Pas de tests unitaires/intégration au MVP.** À la place :

- TypeScript strict (compile time)
- Zod validation (runtime input)
- Tests manuels documentés (`docs/manual-testing.md`)
- Sentry post-launch
- Stripe sandbox + `stripe listen` en dev

**À ajouter en V2 (priorité) :** logique de matching, calculs wallet.

---

## 13. Découpage en sprints

### Sprint 0 — Foundation (J1)
Init repo, Prisma + Neon, Auth.js, layouts route groups, shadcn/ui, seed initial, premier déploiement Vercel preview.

### Sprint 1 — Création lead client (J2-J3)
Formulaire multi-step, géocodage BAN, Server Action createLead, email "Demande reçue".

### Sprint 2 — Matching + dashboard pro lecture (J4-J6)
Logique matching, dashboard pro, inscription pro, paramètres pro, emails matching.

### Sprint 3 — Wallet + accept/refuse (J7-J8)
Stripe Checkout, webhook, transaction atomique débit, accept/refuse leads.

### Sprint 4 — Panel admin + cron (J9-J10)
Validation pros, catalogue, wallet manuel, audit log, config, cron timeouts + élargissement, digest admin.

### Sprint 5 — PWA + Push + emails + polish (J11-J13)
Manifest, service worker, web push, install prompt, tous emails finalisés, design pass complet.

### Sprint 6 — Buffer + prod (J14-J15)
Domaine, DNS, env prod, migration prod, Stripe live, test e2e prod, retours Kamel.

---

## 14. Variables d'environnement

```
# BDD
DATABASE_URL=

# Auth.js
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=

# Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Upstash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Sentry
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# Cron
CRON_SECRET=

# Admin seed
ADMIN_EMAIL=
ADMIN_INITIAL_PASSWORD=
```

---

## 15. Décisions tranchées (récap)

| Sujet | Décision |
|---|---|
| Catégorisation | 3 niveaux : Universe → Category → SubCategory |
| Auth | Auth.js v5 + Prisma adapter |
| BDD | Neon Postgres |
| Géolocalisation | Float lat/lng + haversine SQL custom |
| Argent | Int en centimes |
| Soft delete | User et Lead uniquement |
| Stripe | Customers + Wallet interne (pas Connect) |
| Real-time | Polling SWR 30s |
| Cron | Vercel Cron 5 min |
| Rate limiting | Upstash |
| Monitoring | Sentry |
| Tests automatisés | Aucun au MVP, manuels documentés |
| Sous-domaines | Non (sous-chemins) |
| URLs | Français |
| Déploiement | Vercel Pro |

---

## 16. Questions ouvertes (Kamel)

À récupérer avant Sprint 1 :

1. Compte Stripe à son nom : confirmation
2. PDFs légaux : deadline J+5
3. Débit multiple sur lead partagé : confirmation
4. Rayons 25/50/100km : confirmation
5. Nb pros par lead partagé : 2 ou 3
6. Délai 2h fixe ou variable selon urgence
7. Round-robin exclusif : confirmation
8. Multiplicateur exclusif : x2 ou x2.5
9. Description visible avant débit : confirmation
10. Recommandations manuelles si lead non matché
11. 3 niveaux catalogue : confirmé (mais à valider explicitement)
12. Packs wallet prédéfinis vs libre + bonus

Sprint 0 démarrable sans ces réponses. Sprint 1 nécessite réponse Q1-Q3 minimum.
