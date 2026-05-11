# Itération de dépolissage — casser les patterns IA-like

Le rendu V7 est globalement bon mais il a encore le côté "template SaaS shadcn" qu'on voit partout depuis 2023. On veut quelque chose de plus typé, plus éditorial, plus vivant. **Pas plus créatif** — plus humain.

L'idée : un humain qui design **enlève** plutôt que d'ajouter. Il laisse du blanc, ne met pas d'icône partout, varie les traitements selon ce qui mérite de l'attention.

---

## Sections à refondre (priorité dans cet ordre)

### 1. "Nos catégories les plus populaires"

**Problème actuel** :
- 9 cards en grille avec border slate-200, icône Lucide bleue, label, sous-label "X pros disponibles"
- Tous traités identiquement, archi-vu sur tous les sites B2C 2024-2026

**À faire** :
- **Supprimer les cards** : pas de border, pas de shadow, pas de fond coloré
- Layout : grille de 9 items, simple, **séparés par des bordures fines slate-200 (1px) en grille interne**, pas chacun dans sa box (genre tableau avec lignes)
- Ou alternative : 9 items sur 2 lignes, fond légèrement teinté pour la zone entière, icône plus grosse en monochrome bleu marine, label en gras
- **Pas de carré bleu pâle derrière l'icône**
- **"SOS Dépannage" en accent rouge net** (pas orange/rouge pâle) avec un badge "24/7" en petit pill rouge à côté du label, pas en sous-titre

### 2. "Ils nous font confiance" — témoignages

**Problème actuel** :
- 3 cards uniformes avec photo ronde + nom + ville + texte + 5 étoiles
- 4ème card Trustpilot dans le même format → ça noie tout

**À faire** :
- **Supprimer les cards et les bordures**
- Layout : 3 témoignages disposés en grille **sans aucune box**, chaque témoignage est juste du contenu posé sur le fond de page
- Hiérarchie : 
  - Étoiles colorées (étoiles orange #fbbf24 pleines) tout en haut
  - Texte du témoignage en typo plus large que d'habitude (~17-18px), sans guillemets décoratifs (juste les guillemets typo `« »` français)
  - Signature en bas : **pas de photo ronde**, juste nom en gras + ville en gris (sobre, comme un magazine)
- **Trustpilot** : sort de la grille des témoignages. Mis ailleurs sur la page (au-dessus, dans une bande horizontale fine, juste : étoiles + "4,7/5 sur Trustpilot" + label "Excellent" sur fond uni). **Pas dans une card.**

### 3. Section stats sous le hero

**Problème actuel** :
- 4 stat cards avec icône ronde bleu pâle + valeur + label

**À faire** :
- **Supprimer les cards individuelles**
- Layout : une bande horizontale unique fond blanc avec **bordure verticale fine entre chaque stat** (séparateurs slate-200, pas de cards)
- **Supprimer les icônes rondes** : juste les chiffres en GROS (text-4xl ou plus, bold), label en dessous en gris small
- Chiffres en bleu marine, labels en gris slate-500
- Alignés sur une bande horizontale qui couvre la largeur du container, sans box autour

### 4. "Comment ça marche ?"

**Problème actuel** :
- 3 étapes 1-2-3 avec cercles bleu pâle contenant des icônes Lucide
- Card autour de la section

**À faire** :
- **Supprimer la card autour de la section**
- Numéros 01, 02, 03 en **très grande typographie** (text-6xl ou 7xl, bold, couleur bleu marine), pas dans des cercles
- Pas d'icône Lucide dans des cercles — on enlève les icônes complètement, les numéros suffisent
- Titre de l'étape en bold standard
- Description sobre en dessous
- Flèches de connexion entre les étapes : simples, fines, traits bleu marine légers (ou supprimer carrément, l'ordre 01/02/03 suffit)

### 5. Trust badges du hero (les 3 sous le slogan)

**Problème actuel** :
- 3 trust badges avec icône ronde outline + 2 lignes de texte

**À faire** (référence maquette `landing_page_particuliers.png`) :
- Mettre les 3 badges côte à côte sur **une ligne horizontale** (au lieu d'une liste verticale)
- Format minimaliste : **icône Lucide simple** (CheckCircle, ShieldCheck, Lightbulb) avec icône à gauche en bleu marine
- À droite de l'icône : 2 lignes texte (titre + description courte)
- **Pas de fond, pas de bordure, pas de cercle outline autour de l'icône**
- Juste : icône fine bleu marine + texte aligné, séparés par padding horizontal entre les 3
- Ajouter à droite de la ligne le badge **"Plateforme 100% Belge"** qu'on a déjà, pour faire 4 éléments alignés sur la ligne

---

## Principes généraux à appliquer

### Variations de hiérarchie visuelle

Actuellement toutes les sections ont le même traitement : titre h2 + sous-titre + contenu. Trop uniforme. À varier :

- Section "Comment ça marche" : titre h2 **aligné à gauche** avec un mot en accent orange, pas centré
- Section "Catégories populaires" : **pas de sous-titre**, juste le titre + le lien "Voir tous les métiers →" à droite (déjà OK)
- Section "Témoignages" : titre **centré** mais avec une mention preuve en sous-titre genre "X avis vérifiés"
- Bandeau primes Wallonie : déjà bien, garder

### Densité d'icônes

Trop d'icônes Lucide partout = effet template. Réduire :

- Sections où elles restent : trust badges hero, grille catégories, sidebar checkmarks
- Sections où on les retire : "Comment ça marche" (gros numéros suffisent), stats (chiffres suffisent), témoignages (étoiles suffisent), section "Vous êtes un professionnel" (le visuel illustration suffit)

### Pas de cercles colorés derrière les icônes

C'est un pattern signature des templates IA. À bannir partout. Si une icône est dans un cercle, elle doit avoir une raison fonctionnelle, pas décorative.

---

## Ce qui reste OK et qu'on ne touche pas

- **Header** : très bien, garder intact
- **Hero** : OK on a fini les itérations dessus, sauf les trust badges (point 5)
- **Bandeau primes Région Wallonne** : très bien (coq jaune, bouton orange), garder
- **Section B2B placeholder** : OK, garder
- **Section "Vous êtes un professionnel ?"** : OK, garder
- **Footer** : OK, garder

---

## Livrables

Met à jour :
- `components/Stats.jsx`
- `components/Categories.jsx`
- `components/Testimonials.jsx`
- `components/HowItWorks.jsx`
- `components/Hero.jsx` (uniquement la zone des 3 trust badges + 100% Belge)

Tous les autres fichiers restent intacts.

---

## Hiérarchie d'autorité

1. Variation de traitement visuel entre sections > uniformité shadcn par défaut
2. Suppression des cards/borders/cercles > ajout d'éléments décoratifs
3. Typographie comme outil principal > icônes comme outil principal
4. Si tu hésites entre "ajouter du visuel" et "laisser respirer" → laisser respirer

---

## Avant de coder

Confirme que tu comprends :
- Categories : pas de cards individuelles, grille avec séparateurs fins
- Témoignages : pas de cards, pas de photos rondes, juste contenu posé sur fond
- Stats : bande horizontale unique avec séparateurs, gros chiffres sans icônes ni cards
- Comment ça marche : pas de card, gros numéros 01/02/03, pas d'icônes Lucide dans cercles
- Trust badges hero : ligne horizontale avec icônes simples (pas cercles outline), + badge 100% Belge à la suite
- Trustpilot sort des témoignages, isolé dans son propre traitement minimal
