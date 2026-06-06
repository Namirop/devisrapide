# Anti-AI Design Patterns — Skill UI/UX

Référence pour identifier et corriger les patterns visuels qui font qu'une interface "sent l'IA" — c'est-à-dire qui la rend interchangeable avec n'importe quel autre projet généré sans pensée design. Applicable web et mobile.

Lecture autonome. À consulter au début de tout projet d'interface, et à re-consulter quand un écran "ne fait pas pro" sans qu'on sache pourquoi.

---

## Sommaire

1. [Principes directeurs](#1-principes-directeurs)
2. [Patterns de structure et de composition](#2-patterns-de-structure-et-de-composition)
3. [Patterns typographiques](#3-patterns-typographiques)
4. [Patterns d'espacement](#4-patterns-despacement)
5. [Patterns de couleur et d'accent](#5-patterns-de-couleur-et-daccent)
6. [Patterns de décoration](#6-patterns-de-décoration)
7. [Patterns de formulaire](#7-patterns-de-formulaire)
8. [Patterns de mise en avant de données](#8-patterns-de-mise-en-avant-de-données)
9. [Règles transversales](#9-règles-transversales)
10. [Checklist de fin d'écran](#10-checklist-de-fin-décran)

---

## 1. Principes directeurs

Avant les patterns spécifiques, sept principes qui orientent toutes les décisions ci-dessous.

### A. La forme suit la fonction

Avant de créer un composant visuel (card, grid, hero, container), lister les informations ou actions qu'il doit servir. Si la liste est vide ou famélique (< 3-4 items concrets), le composant ne doit pas exister sous cette forme. Beaucoup de patterns "AI-like" sont des contenants vides habillés de styling.

### B. L'accent est une signalisation, pas une décoration

La couleur brand a un coût d'attention. Chaque occurrence consomme un peu de l'attention de l'utilisateur. Si une occurrence n'a pas de **fonction sémantique vérifiable** (CTA primaire, prix, statut critique, identité brand sur un élément unique), elle dégrade le pouvoir des occurrences justifiées.

### C. Connaître le pattern avant d'auditer

L'erreur classique : "ça ne fait pas pro, j'ajoute des trucs". Le bon réflexe : "ça ne fait pas pro, j'identifie le pattern qui parasite et je le retire". 90% des fixes consistent à enlever, pas à ajouter.

### D. Le type porte le design

Les designs premium 2024-2026 reposent sur des **titres massifs** qui structurent la page. Avant d'ajouter des décorations (bordures, icônes, gradients), pousser la taille des titres et l'écart entre hiérarchies typographiques. Le contraste typographique est la première arme.

### E. Casser le pattern par un élément métier unique

Une IA générique pond un design qui pourrait s'appliquer à n'importe quel produit. Pour briser cet effet, identifier UN pattern visuel **spécifique au métier** (un mode de visualisation, un format de carte, une composition inattendue) qu'aucune génération automatique ne produirait spontanément. C'est cet élément qui fait que l'interface est mémorable.

### F. Inspirer hors du SaaS mainstream

Linear, Vercel, Stripe, Notion sont les références par défaut, donc les références "AI". Pour sortir du moule, élargir : sites de marques de luxe, magazines éditoriaux, studios créatifs, portfolios de designers indépendants, sites de produits artisanaux. L'œil capte des patterns inhabituels et les réinjecte ailleurs.

### G. Audit avant ménage

Avant de modifier une couleur, une police, un espacement systémique : faire un audit complet des occurrences existantes. Catégoriser (essentiel / à évaluer / à retirer). Définir une règle stratégique (ex: "max 5 occurrences brand par page"). Procéder en passes successives. Le ménage en bulk sans audit casse plus qu'il ne répare.

---

## 2. Patterns de structure et de composition

### Pattern : trois cards symétriques "bénéfices"

**Symptôme** : grid `1fr 1fr 1fr`, trois cards de mêmes dimensions, chacune avec icône en haut + titre + paragraphe. Lecture immédiate : "génération automatique".

```tsx
// ❌ AI-like — pattern reconnaissable instantanément
<div className="grid grid-cols-3 gap-6">
  <Card>
    <Icon /> <Title /> <Description />
  </Card>
  <Card>
    <Icon /> <Title /> <Description />
  </Card>
  <Card>
    <Icon /> <Title /> <Description />
  </Card>
</div>
```

**Antidotes** :

- **Stats nues sans cards** : si l'objectif est de communiquer des bénéfices chiffrés, virer les cards et exposer les chiffres en grand (text-6xl à text-8xl) avec labels en dessous. L'impact visuel est multiplié, le pattern disparaît.
- **Composition asymétrique justifiée** : tailles différentes parce que contenus différents (une card avec contenu long + deux cards plus courtes empilées à côté). L'asymétrie doit être _justifiée par le contenu_, pas décorative.
- **Liste éditoriale** : remplacer le grid par une liste verticale avec puces typographiques fortes, type "article de magazine". Aucune card.

**Quand la grid 3 colonnes est valide** : quand chaque case porte une vraie comparaison item-à-item (ex: 3 plans tarifaires comparés). Là, la symétrie _est_ le message.

---

### Pattern : container vide habillé de styling

**Symptôme** : "j'ai du texte → je le mets dans une card pour faire pro". Une card avec un titre, deux phrases, et c'est tout. Le container existe pour habiller le vide.

**Test diagnostic** : si on retire la bordure/le fond de la card, le contenu perd-il quelque chose ? Si la réponse est non, la card ne devrait pas exister.

**Antidotes** :

- **Densité minimum** : pour qu'une card existe, son contenu doit être dense (5+ informations métier utiles, ou 1 action principale claire). Sinon, contenu nu sur le fond de page.
- **Marquer la zone autrement** : si on veut différencier une zone, utiliser un changement de fond subtil (luminosité ± 5%), un trait vertical à gauche, ou un espacement vertical marqué. Pas un container.

---

### Pattern : symétrie excessive (centrage par défaut)

**Symptôme** : tous les éléments sont centrés. Hero centré, sections centrées, CTAs centrés, footer centré. Le résultat ressemble aux landing pages 2015-2018.

**Antidote** : varier les alignements. Gauche prédomine pour la lecture (langues latines), centre réservé aux vrais hero et CTAs principaux. Droite peut servir pour les éléments d'action récurrents (boutons "publier", "envoyer"). L'asymétrie maîtrisée crée du rythme.

**Règle pratique** : sur une page, pas plus de 2-3 éléments centrés. Si une section est centrée, la suivante devrait l'être moins.

---

### Pattern : absence de pattern spécifique au métier

**Symptôme** : tous les composants de l'écran pourraient être copiés-collés sur n'importe quel autre SaaS. L'interface est interchangeable.

**Antidote** : inventer **un** pattern visuel propre au métier. Quelques exemples concrets pour donner l'idée (à adapter au domaine) :

- Plateforme de publication → preview "navigateur" intégrée (chrome avec dots macOS, barre d'URL) pendant la rédaction.
- App de fitness → timeline en bande dessinée avec dates clés.
- App de musique → forme d'onde stylisée comme élément d'identité.
- Outil de finance → grille tabulaire avec séparateurs typographiques type journal.
- Plateforme de billetterie → format "ticket" déchiré sur les confirmations.

Ce pattern doit apparaître à des endroits stratégiques (homepage, écran principal de l'app, confirmations). Il devient la signature.

---

### Pattern : layout 60/40 vs 50/50

**Symptôme** : layouts en grid `1fr 1fr` partout (50/50), équilibre parfait. C'est sécurisant mais générique.

**Antidote** : layouts asymétriques mesurés. 60/40, 65/35, 70/30 selon le poids relatif des contenus. La colonne dominante porte le contenu principal, la colonne secondaire porte le contexte/la preview/l'aide. Sur mobile, ces ratios disparaissent et on empile.

---

## 3. Patterns typographiques

### Pattern : police par défaut "safe" / overused

**Symptôme** : choix par défaut sur Inter, Work Sans, Roboto, Open Sans. Polices techniquement excellentes mais saturées dans le SaaS. L'œil informé reconnaît immédiatement.

**Antidotes** :

- **Polices moins vues** mais conçues pour l'UI : Mona Sans, Hubot Sans, Switzer, General Sans, Manrope, Bricolage Grotesque, Geist (à doser car déjà très Vercel).
- **Combinaisons display + body** travaillées : Fraunces + Manrope, Hubot + Mona, PolySans + Inter Tight, Editorial New + Söhne.
- **Polices custom ou semi-custom** : sur projets premium, envisager une police de tête custom (display uniquement, body restant standard).

**Règle pratique** : avant de choisir Inter "parce que ça marche partout", se demander si le projet supporte une police plus distinctive. Si c'est un outil interne pur, Inter est OK. Si c'est un produit public premium, viser plus haut.

---

### Pattern : titres sous-dimensionnés

**Symptôme** : H1 hero à 40-60px, H2 sections à 24-32px. Le titre est "lisible" mais ne porte pas le design. Conséquence : la composition dépend des décorations (gradients, icônes, glow) pour exister.

**Règle des titres premium 2024-2026** :

| Niveau                        | Desktop  | Mobile  |
| ----------------------------- | -------- | ------- |
| H1 hero marketing             | 88-120px | 48-64px |
| H2 sections marketing         | 56-72px  | 36-44px |
| H1 pages internes (dashboard) | 32-40px  | 24-28px |
| H2 sections internes          | 20-24px  | 18-20px |

Sur web, line-height des titres multi-lignes : 0.95-1.05 (pas 1.3-1.5 comme du body text). Letter-spacing négatif léger (-0.02em à -0.04em) sur les très gros titres.

Sur mobile, pousser les tailles plus haut que ce qu'on pense raisonnable. Un H1 mobile à 56px paraît énorme en maquette mais juste à l'œil sur écran.

---

### Pattern : police display partout

**Symptôme** : la police display utilisée pour les titres marketing est aussi utilisée pour les titres internes (dashboards, modales, formulaires). La police perd son pouvoir éditorial dès qu'elle est appliquée à des éléments utilitaires.

**Règle** : police display = MARKETING UNIQUEMENT. Hors marketing, utiliser la police body en bold (700) ou semibold (600). Le contraste éditorial vient de la hiérarchie (taille + weight + ornements), pas du changement de famille.

| Catégorie                          | Police                 |
| ---------------------------------- | ---------------------- |
| H1 hero landing                    | Display                |
| H2 sections marketing              | Display                |
| H1 pages légales, OG images        | Display                |
| **Tout le reste** (UI, dashboards) | **Body bold/semibold** |

Cas borderline (composant partagé marketing + interne) : **splitter en deux composants distincts** (`MarketingSectionTitle` vs `SectionTitle`) plutôt qu'un prop `variant`. Le nom devient la garantie.

---

### Pattern : chiffres sans `tabular-nums`

**Symptôme** : dans une grille de stats ou un tableau, les chiffres ne sont pas alignés verticalement. "127" est plus large que "117" parce que le "2" est plus large que le "1" en figures proportionnelles. Effet "amateur" immédiat.

**Antidote** : sur tout chiffre affiché en quantité (stats, prix, compteurs, scores, montants), appliquer `tabular-nums` (CSS `font-variant-numeric: tabular-nums`).

```tsx
<span className="text-4xl font-bold tabular-nums">{value}</span>
```

---

## 4. Patterns d'espacement

### Pattern : espacement uniforme partout

**Symptôme** : tous les `gap` à 16px, tous les `margin-bottom` à 24px, tout flotte de la même manière. Aucune hiérarchie visuelle, aucun groupement.

**Règle d'unité visuelle** : les éléments d'une même unité doivent être _proches_, les groupes différents doivent être _séparés_.

| Relation                                       | Espacement |
| ---------------------------------------------- | ---------- |
| Éléments liés (kicker + titre, label + input)  | 4-12px     |
| Éléments d'un même groupe (titre + paragraphe) | 16-24px    |
| Sous-sections d'une même section               | 40-56px    |
| Sections différentes (changement de sujet)     | 80-120px   |
| Grandes ruptures éditoriales                   | 140-200px  |

L'erreur AI : tout à 16-24px uniformément. Le bon design : un rythme avec des respirations marquées.

**Sur mobile** : ces valeurs descendent (les très grandes valeurs deviennent insupportables sur petit écran). Garder le ratio relatif, diviser par 1.4-1.6 environ.

---

### Pattern : padding interne identique sur toutes les cards

**Symptôme** : toutes les cards ont `padding: 24px` quel que soit leur contenu et leur rôle. Une stat card avec un chiffre + label a le même padding qu'une card hero avec image + 3 paragraphes.

**Antidote** : ajuster le padding au contenu et au rôle.

- Cards utilitaires denses (lignes de tableau, items de liste) : padding 12-16px
- Cards informatives (preview, summary) : padding 20-28px
- Cards "hero" / mises en avant (CTA card, pricing card) : padding 32-48px

---

## 5. Patterns de couleur et d'accent

### Pattern : surutilisation des accents de couleur

**Symptôme** : la couleur brand est mise partout — icônes, borders, bullets, checks, kickers, glow décoratifs, success messages, links. L'accent perd son pouvoir.

**Antidote** :

1. **Audit complet** : grep ou recherche visuelle de toutes les occurrences de la couleur brand sur une page. Compter.
2. **Catégoriser** :
   - **Essentiel** : CTA primaire, prix, identité brand sur 1-2 éléments, état critique.
   - **À évaluer** : kickers, labels, icônes "informatives".
   - **À retirer** : bullets, checks décoratifs, borders d'accent gratuites, glow.
3. **Règle stratégique par page** : max 3-5 occurrences brand par page. La couleur doit être une _récompense visuelle rare_.
4. **Passes successives** : pas de ménage en bulk. Retirer une catégorie, vérifier visuellement, continuer.

---

### Pattern : success messages en couleur brand

**Symptôme** : "Sauvegardé", "Note mise à jour", "Profil enregistré" en couleur brand. Confusion sémantique entre "succès" (action terminée OK) et "identité" (couleur du produit).

**Antidote** : success messages en **blanc neutre** ou couleur foreground standard. La couleur brand reste sur la conversion (CTA, prix, value props) et l'identité. Le vert n'est pas non plus obligatoire — un blanc neutre avec une discrète icône check suffit pour 90% des cas.

---

### Pattern : surface chaude / colorée pour tout

**Symptôme** : utiliser une couleur de fond "chaude" (brun, marron, beige) pour tenter de "réchauffer" l'interface, mais l'appliquer partout, y compris sur les outils internes.

**Distinction critique** :

- **Zones de conversion** (forms d'inscription, paywall, CTAs majeurs) : un fond chaud subtil peut justifier le boost émotionnel.
- **Outils internes** (dashboard, panel admin, settings) : l'utilisateur est déjà engagé, pas besoin de le "chauffer". Le fond doit rester neutre (noir ou blanc selon thème).

La couleur chaude perd son sens si elle est partout. Réserver, comme l'accent.

---

### Pattern : glow / shadow néon sur éléments non-CTA

**Symptôme** : `box-shadow` en couleur brand sur des cards informatives, des borders avec lueur, du néon "premium luxe". Pattern signature de l'IA générée.

**Antidote** :

- **Glow réservé au CTA principal unique** d'une page, et encore (peut être omis sans perte).
- **Pour faire ressortir un élément informatif** : utiliser une nuance de fond différente (luminosité ± 3-5%), pas un glow.
- **Pour un focus state** : bordure qui change d'opacité (30% → 100%), pas un ring néon.

---

### Pattern : gradient blanc au centre des boutons colorés

**Symptôme** : un bouton brand (ex: doré, bleu marine) avec un dégradé qui devient blanc/clair au milieu. Lecture immédiate : "bouton IA premium luxe".

**Antidote** : gradient uniforme dans les tons du brand (si gradient il y a), ou couleur plate avec micro-brillance au hover seulement. Souvent : pas de gradient du tout, juste un fond plein bien choisi.

---

## 6. Patterns de décoration

### Pattern : icônes décoratives sans utilité

**Symptôme** : icône à côté de chaque mot-clé. Étoile pour "Visibilité", porte-monnaie pour "Revenus", cible pour "Objectifs", éclair pour "Rapide". L'icône est la traduction littérale du mot — décoration plaquée sans valeur.

**Règle** : un icône doit avoir une **fonction**, pas une équivalence sémantique.

| Fonction valide                           | Exemple                                |
| ----------------------------------------- | -------------------------------------- |
| Geste plus expressif que le mot           | Croix pour fermer, poubelle pour supp. |
| Signal de statut métier vérifiable        | ⚡ pour "expert featured"              |
| Distinction visuelle nécessaire en grille | Logos de sources dans un agrégateur    |

Si on ne peut pas écrire en une phrase pourquoi cet icône est là, l'icône doit dégager.

**Antidote général** : pour les "bénéfices" / "value props", remplacer les icônes par des **chiffres précis** ou des **mini-graphiques pertinents**. L'impact est 10x plus fort qu'un picto.

---

### Pattern : chips / pills arrondis avec emoji

**Symptôme** : pills `rounded-full` avec fond pastel et emoji décoratif. Look "wellness app" générique : `🌿 Holistique`, `🔥 Trending`, `💎 Premium`.

**Antidote selon contexte** :

- **Tags inline éditoriaux** : `+ Football`, `+ Tennis` avec préfixe `+` ou `✓`, **sans pill**. Texte aligné, pas de fond.
- **Buttons rectangulaires** : `radius 3-6px max`, pas `rounded-full`.
- **Liste avec checkboxes alignées** : alignement vertical strict, sans emoji.
- **Tags textuels uppercase** : `FOOTBALL · TENNIS · BASKET` avec middot, sans pill.

Pas d'emoji décoratif systématique. Si emoji il y a, il doit être _fonctionnel_ (drapeau d'un pays pour la langue, par exemple).

---

### Pattern : kickers uppercase dorés répétés

**Symptôme** : `ÉTAPE FINALE`, `QUESTIONS FRÉQUENTES`, `POURQUOI NOUS`, `NOS VALEURS` — tous en couleur brand uppercase tracking-wide. Pattern dupliqué qui dilue.

**Antidote** :

- Kickers en `text-muted-foreground` (pas brand). Garder la typo distinctive (uppercase + tracking + petit) mais **sans couleur brand**.
- Maximum 1-2 kickers par page. Si on en a 5, l'effet "rubrique journal" devient effet "template AI".

---

### Pattern : mockups abstraits wireframe

**Symptôme** : pour illustrer un produit/feature, on dessine une "card avec icône User + pseudo + chips + stats" stylisée. Look "design generic AI" reconnaissable.

**Antidotes pour rendre un mockup vivant** :

- **Vraies photos** (avatars réels, même placeholder pravatar). Le visage humain casse le wireframe.
- **Composition asymétrique** : rotation légère, stack de plusieurs mockups, profondeur. Pas une seule card flottante centrée.
- **Micro-détails de "vie"** : point vert "live", timestamp précis (`AUJOURD'HUI · 16:30`), données concrètes (pas "$XX,XXX").
- **Format inattendu** : mockup dans un faux chrome de navigateur (dots macOS rouge/jaune/vert + barre d'URL), ou format "preview iPhone", ou capture stylisée "ouverte dans Figma".

Ces micro-détails coûtent peu et transforment radicalement la perception.

---

## 7. Patterns de formulaire

### Pattern : formulaire "transactionnel" sur page de conversion

**Symptôme** : une page d'inscription / d'achat avec un titre + un form vide en dessous, sur fond neutre. Aucune persuasion, aucune preuve sociale, aucune narrative. Conversion plate.

**Antidote — structure de page de conversion** :

1. **Hero éditorial** : promesse claire + sous-titre + visuel (pas un mockup abstrait).
2. **Bénéfices avant le form** : 3-4 points concrets et chiffrés.
3. **Form en 2 colonnes** : form à gauche, preview/preuve sociale/explication à droite.
4. **FAQ après le form** : objections traitées, pas une section décorative.
5. **Densité d'information utile**, pas de vide.

Sur mobile, ces blocs s'empilent. La preview/preuve sociale passe en bas, le form reste prioritaire.

---

### Pattern : tous les champs ont le même poids visuel

**Symptôme** : sur un form de 10 champs, label identique, input identique, taille identique. Aucune hiérarchie. L'utilisateur ne sait pas ce qui compte.

**Antidote** : hiérarchiser les champs selon leur importance métier.

- **Champ héros** (celui qui définit l'action) : taille plus grande, font différente, traitement visuel distinctif.
- **Champs principaux** : taille standard.
- **Champs optionnels / secondaires** : collapsibles ou plus petits.

Exemple sur un form "publier un article" : le **titre** et le **contenu** sont héros. Catégorie, tags, date sont secondaires. Le titre devrait être 3-4x plus gros qu'un champ "catégorie".

---

### Pattern : labels en bold blanc équivalents au contenu

**Symptôme** : labels du form en `font-bold text-foreground` — même poids visuel que le contenu saisi. L'écran sature.

**Antidote** : labels en `text-muted-foreground`, taille réduite (11-12px), uppercase letter-spacing 0.1-0.15em. Look éditorial type rubrique. Le contenu saisi (qui doit dominer visuellement) garde son contraste max.

**Astérisque obligatoire** : en `text-muted-foreground` aussi (pas en rouge ni en brand). L'obligation n'est pas une alerte.

---

### Pattern : checkbox sec pour décision importante

**Symptôme** : une checkbox sèche en bas de form pour "Marquer comme prioritaire" / "Mettre en avant" / "Activer les notifications". Décision potentiellement importante, traitée comme un opt-in newsletter.

**Antidote** : si la décision a un impact (visibilité, paiement, sécurité), traiter ça comme une **décision** :

- Toggle switch proéminent (44x24px minimum), pas une checkbox 16x16.
- Label sur 2 lignes : titre fort + sous-texte qui explique l'impact.
- Position : pas noyée au milieu des champs, mais après un séparateur visuel.

```tsx
// ❌ Checkbox sèche au milieu du form
<label><input type="checkbox" /> Mettre en avant comme analyse du jour</label>

// ✅ Toggle assumé en bloc autonome
<div className="flex gap-4 pt-8 border-t">
  <Toggle />
  <div>
    <p className="font-medium">Mettre en avant comme analyse du jour</p>
    <p className="text-sm text-muted-foreground">1 par jour. Visibilité maximale sur ton profil.</p>
  </div>
</div>
```

---

### Pattern : deux dropdowns pour saisir une donnée unique

**Symptôme** : pour saisir une heure, deux dropdowns "HH" "MM". Pour saisir une date, trois dropdowns "jour" "mois" "année". Pattern AI form direct.

**Antidote** : un **seul** input texte avec **parse libre côté JS**.

- Heure : accepter "18h30", "18:30", "1830", "18 30", "18h"
- Date : accepter "12/03", "12 mars", "12/03/2026", "12-03-26"
- Normaliser au submit final.

C'est plus rapide à saisir, plus naturel à l'œil, et casse le pattern.

---

### Pattern : bouton submit blanc full-width générique

**Symptôme** : pavé blanc pleine largeur en bas du form, label "Envoyer" ou "Continuer". Pattern Stripe/Linear/Vercel ultra-reconnaissable.

**Antidotes** :

- **Bouton aligné à droite, taille mesurée** (pas full-width).
- **Label spécifique au métier** : "Publier l'analyse" plutôt que "Envoyer", "Devenir membre" plutôt que "S'inscrire".
- **Couleur brand justifiée** : c'est le seul endroit où l'accent doit vivre sur le form.
- **Flèche typographique** ("Continuer →") plutôt qu'icône Phosphor générique.

Sur mobile, le full-width redevient acceptable (espace contraint). Mais le label reste métier-spécifique.

---

### Pattern : preview live ou résumé contextuel sur form long

**Symptôme** : un form long sans aucun feedback contextuel. L'utilisateur ne sait pas ce qu'il prépare, ne voit pas le résultat final.

**Antidote — selon le contexte** :

- **Form de création/publication** : preview live à droite (sur desktop) qui montre le résultat final.
- **Form en plusieurs étapes** : récap des étapes précédentes en haut (compact, en ligne).
- **Form de calcul** : résultat dynamique visible (prix total, taxes, etc.).

C'est aussi un pattern qui peut servir de "pattern métier-spécifique" (principe E).

---

## 8. Patterns de mise en avant de données

### Pattern : cards de stats vanity alignées

**Symptôme** : 3 stat cards en haut de dashboard avec un gros chiffre + label muted ("12 / Abonnements actifs", "47 / Achats", "8 / Sports suivis"). Ces chiffres sont déjà visibles dans la liste qui suit. Duplication.

**Antidote** :

- **Intégrer les stats en prose narrative** : `12 abonnements actifs · 47 achats au total · 8 sports suivis`.
- **Supprimer carrément** si redondantes.

**Quand garder les stat cards** : dashboard analytique pur (admin, BI) où :

1. La donnée n'est PAS répétée ailleurs dans la page.
2. La lecture rapide d'un chiffre est l'usage principal.
3. Les chiffres sont **actionnables** (revenus à reverser, factures en attente).

Pour une page "Mon compte" utilisateur, les stat cards vanity sont du bruit.

---

### Pattern : compteurs entre parenthèses sur titres de section

**Symptôme** : "Abonnements actifs (3)", "Historique (47)", "Mes analyses (12)". L'humain n'écrit jamais comme ça. Le nombre est immédiatement visible dans la liste.

**Antidote** :

```tsx
// ❌ AI-like
<h2>Abonnements actifs (3)</h2>

// ✅ Humain
<h2>Abonnements actifs</h2>
```

Si le compte est vraiment utile (historique très long avec pagination), mention discrète en sous-titre :

```tsx
<h2>Historique</h2>
<p className="text-muted-foreground">47 achats au total</p>
```

---

### Pattern : chiffres vanity décontextualisés

**Symptôme** : "67%", "142", "89" affichés en grand sans explication. Impression de remplissage, l'utilisateur cherche un sens.

**Antidote** :

- **Chiffres avec contexte utile** : "80% du CA te revient" (pas juste "80%").
- **Chiffres avec unité claire** : "30 sec pour publier" (pas juste "30").
- **Prose narrative** qui intègre les chiffres dans une phrase.

---

### Pattern : prose narrative > listing chiffré

**Symptôme** : méta-données passives en `dl/dt/dd` :

```tsx
// ❌ AI-like
<dl>
  <dt>Inscrit depuis</dt><dd>12 mois</dd>
  <dt>Dernière connexion</dt><dd>2 jours</dd>
</dl>

// ✅ Humain
<p className="text-muted-foreground">
  Membre depuis janvier 2026 · Dernière visite il y a 2 jours
</p>
```

Les vraies "stat cards" doivent être réservées aux chiffres **actionnables** — pas aux méta-données décoratives.

---

### Pattern : empty states avec illustration + emoji + 3 phrases

**Symptôme** :

```tsx
<div className="text-center">
  <span className="text-6xl">📭</span>
  <h3>Pas de message</h3>
  <p>Aucun message reçu pour le moment.</p>
  <p>Reviens plus tard !</p>
  <Button>Composer un message</Button>
</div>
```

Trois phrases pour dire la même chose + emoji + CTA.

**Antidote** : une phrase de constat, une de contexte, une action (si elle a du sens).

```tsx
<div className="text-center">
  <p className="text-foreground">Aucun message</p>
  <p className="text-muted-foreground">
    Les nouveaux messages apparaîtront ici.
  </p>
  <Button>Composer</Button>
</div>
```

Pas d'illustration sauf si elle est vraiment travaillée et porte de l'identité. L'emoji 📭 est interdit.

---

## 9. Règles transversales

### A. Audit avant ménage

Avant de toucher une couleur/police/espacement systémique : audit complet → catégorisation (essentiel / à évaluer / à retirer) → règle stratégique par page → passes successives. Jamais de ménage en bulk.

### B. Type-driven design

Pousser la taille des titres avant d'ajouter des décorations. Si un design "manque de quelque chose", le premier réflexe est d'augmenter le titre principal, pas d'ajouter un gradient ou une icône.

### C. Contenu avant container

Lister les informations métier ou actions utilisateur avant de créer un composant visuel. Si la liste < 4-5 items concrets, le composant ne devrait pas exister sous cette forme.

### D. Espacement en unité visuelle

Éléments d'une même unité visuelle proches (4-16px). Séparations entre unités marquées (60-120px). L'erreur AI : tout à 16-24px uniformément.

### E. Connaître son accent

La couleur brand ne décore pas, elle signale. Chaque occurrence doit être justifiée par une fonction sémantique (CTA, prix, identité brand, statut critique). Si pas justifiée, retirer.

### F. Casser le pattern par un élément métier unique

Inventer UN pattern visuel spécifique au métier (preview live, mini-narration, format inattendu) qui apparaît à des endroits stratégiques. C'est ce que la génération automatique ne produit pas spontanément.

### G. Inspiration hors SaaS mainstream

Ne pas se limiter à Linear/Vercel/Stripe/Notion. Aller voir sites de marques de luxe, magazines éditoriaux, studios créatifs, portfolios indépendants. L'œil capte des patterns inhabituels et les réinjecte.

---

## 10. Checklist de fin d'écran

Avant de marquer un écran comme "done", passer cette checklist (rapide, ~5 minutes par écran) :

**Structure & composition**

- [ ] Pas de grid 3 colonnes symétriques pour des "bénéfices" sans justification produit ?
- [ ] Pas de card-container vide qui habille moins de 4-5 informations utiles ?
- [ ] Au moins un élément asymétrique ou hors-pattern (sinon écran "interchangeable") ?

**Typographie**

- [ ] H1 et H2 atteignent les tailles "premium" pour le contexte (marketing : 88+/56+ ; interne : 32+/20+) ?
- [ ] Police display utilisée _uniquement_ en marketing ?
- [ ] `tabular-nums` sur tous les chiffres en quantité ?

**Espacement**

- [ ] Éléments liés rapprochés (< 16px), groupes différents séparés (> 60px) ?
- [ ] Padding adapté au rôle de chaque card (utilitaire/info/hero) ?

**Couleur**

- [ ] Moins de 5 occurrences brand sur la page ?
- [ ] Success messages en blanc neutre, pas en brand ?
- [ ] Pas de glow néon sur éléments non-CTA ?

**Décoration**

- [ ] Chaque icône a une fonction métier vérifiable (sinon retirer) ?
- [ ] Pas de pills rounded-full + emoji ?
- [ ] Pas de kicker uppercase coloré brand répété plus de 1-2 fois ?

**Formulaires**

- [ ] Hiérarchie visuelle entre champs (héros, principaux, secondaires) ?
- [ ] Labels en muted, pas en bold foreground ?
- [ ] Bouton submit aligné/dimensionné métier (pas pavé blanc full-width générique) ?
- [ ] Pas de dropdown HH/MM ni jour/mois/année séparés ?

**Données**

- [ ] Pas de stat cards qui dupliquent l'info de la liste en-dessous ?
- [ ] Pas de "(N)" entre parenthèses dans les titres de section ?
- [ ] Empty states en 2 phrases max, sans emoji 📭/📭-like ?

Si l'écran coche 80%+ des items, il est sensiblement moins "AI-like" que la moyenne. Si plusieurs cases sautent, isoler les patterns concernés et appliquer les antidotes ci-dessus.

---

## Annexe : déclencheurs d'usage

Ce skill se lit utilement à :

- **Début de projet** : avant les premiers écrans, pour cadrer les choix de typo, palette, structure.
- **Audit d'écran** : quand un écran "sent l'IA" sans qu'on sache pourquoi, pour identifier les patterns.
- **Avant un sprint design** : pour briefer un designer humain (sœur, freelance) avec les patterns à éviter.
- **Revue de PR avec génération automatique** : pour repérer les patterns introduits par CC/autres.
- **Fin de feature** : passer la checklist §10 avant de considérer "done".

Ne pas appliquer ce skill comme une règle rigide : certaines situations justifient les "patterns AI" (un dashboard BI a légitimement des stat cards). Le skill sert à _identifier_ les patterns pour pouvoir les conserver consciemment ou les retirer — pas à les bannir aveuglément.
