# Itération finale Claude Design — raffinement V3

Dernière itération de raffinement. Tu as livré la V3 il y a peu, j'ai testé l'intégration et je relève des écarts importants avec la maquette de référence `docs/references/landing_page_particuliers.png`.

Cette itération doit corriger ces écarts. Pas de réinvention, pas de "amélioration libre". Tu reproduis la maquette PIXEL-NEAR cette fois.

---

## Écarts à corriger

### 1. SUPPRIMER le bandeau bleu marine en haut "La plateforme N°1 en Belgique"

Cette barre n'existe pas dans la maquette. La maquette commence directement par le header blanc principal (logo + nav + tel + boutons). Le drapeau + mention "Plateforme N°1" est intégré uniquement dans le hero, pas dans le header.

### 2. HERO — refonte fondamentale du layout photo + slogan + form

Sur la maquette :

- Le **fond du hero est un gris très clair uniforme** (slate-50 / `#f8fafc`), pas de cards distinctes
- La **photo artisan est posée directement sur ce fond, SANS cadre arrondi, SANS shadow, SANS rounded-xl**. Elle se fond naturellement au fond.
- L'artisan est cropped sur fond légèrement flou qui matche presque le slate-50. Pas d'effet "card d'image".
- Le slogan est sur le bloc gauche, **AU-DESSUS de la photo ou À CÔTÉ**, en bleu marine pur (`#1e3a8a`) sur fond clair, PAS en blanc sur gradient sombre. La photo est utilisée comme appui visuel, pas comme background du texte.
- Le badge "🇧🇪 La plateforme N°1 en Belgique pour vos travaux" est un **petit badge orange clair (`#fef3e2` background, `#ea580c` text) au-dessus du slogan**, en taille mono-style petit, pas un overlay foncé.
- Le form à droite est une **card blanche avec ombre légère et bordure subtile slate-200**, posée sur le même fond gris clair. Pas de shadow-2xl exagéré. Elle est intégrée, pas "flottante".

Concrètement, le layout du hero devient (variante 1 — photo en bas-gauche) :

```
Fond slate-50 uniforme partout

[Badge orange] La plateforme N°1...

Le bon artisan,            CARD FORM blanche
sans téléphoner            shadow-sm + border-slate-200
à quinze numéros.          
(bleu marine + orange      Décrivez votre besoin...
sur la 3e ligne)           Stepper 1-2-3
                           Quel type de service?
Sous-texte                 Grille 3x3 catégories
                           Continuer →
[Photo artisan             Sans inscription · Gratuit
bleed sans cadre]          

Trust badges horiz
Trustpilot + Belge
```

Ou variante 2 — photo plein bleed à gauche :

```
Fond slate-50

[Photo artisan        ]    [Card form blanche]
[pleine bleed gauche  ]    [intégrée droite ]
[pas de cadre arrondi ]
[pas de shadow        ]
[se fond au fond      ]

Slogan superposé EN BAS de la photo en bleu marine pur
avec un fond blanc semi-opaque derrière pour lisibilité
(PAS un gradient noir, juste une zone blanche légère)
```

Choisis l'approche la plus proche de la maquette. Mais OBLIGATOIRE : photo sans cadre arrondi, slogan en bleu marine sur fond clair (pas blanc sur sombre), card form intégrée pas flottante exagérément.

### 3. STATS sous le hero — refonte

Maquette : 4 stats avec icône ronde fond bleu clair (`#dbeafe`) + valeur en bold + label en dessous. Disposés sur **une seule ligne horizontale, bord à bord, séparés par une bordure verticale fine ou par un padding égal**, pas dans des cards individuelles avec border.

À reproduire : 4 stats alignées (32 / 127 / 4,7-sur-5 / 4h) sur un fond légèrement différent (carte large unique ou bande horizontale), pas 4 cards séparées.

### 4. SECTION "Nos catégories les plus populaires"

C'est la section qui fait LE PLUS IA-like actuellement.

Maquette : 9 catégories en ligne horizontale, **chacune dans une card minimale fond blanc, bordure 1px slate-200, PAS de border-radius marqué (juste 4-6px max), icône bleue moyenne, label, sous-label "X pros disponibles" en gris small**. Pas de carré coloré bleu pâle derrière l'icône.

À corriger :

- Supprimer le carré bleu pâle derrière chaque icône
- Border-radius des cards : 6px max, pas 12px ou plus
- Aucun shadow par défaut, juste sur hover
- Layout : 9 cards en ligne horizontale (pas en grid 3x3 sur desktop, c'est une bande horizontale)
- Icône Lucide bleue (`#1e3a8a`) sans fond coloré derrière
- "SOS Dépannage" en accent : la card a bordure orange/rouge subtile, l'icône en rouge, et un label "Disponible 24/7" en orange en sous-titre

### 5. SECTION TÉMOIGNAGES

Maquette : 3 cards de témoignages côte à côte + 4ème card Trustpilot. Les cards témoignages ont :

- **Étoiles colorées (orange/jaune) en haut**
- Note "5/5" à côté
- Texte du témoignage entre guillemets, ligne courte (2-3 lignes max)
- **Photo ronde de la personne en bas à gauche**, nom en bold, ville en sous-titre

À reproduire fidèlement. Garder les noms : Thomas D. Bruxelles / Sophie L. Liège / Marc V. Namur. Photos rondes (utiliser placeholder avatars avec initiales colorées si pas de vraie photo, ou icone User Lucide dans un cercle coloré).

### 6. CARD FORM HERO — épurer

Maquette : la card form est simple, pas surchargée. À matcher :

- Pas de border visible marquée, juste une ombre légère
- Border-radius 8-10px max
- Padding 24-28px
- Stepper avec cercles bleu marine pleins quand actif (texte blanc dedans), outline gris clair sinon
- Badge "+38 000 demandes traitées" → on l'a remplacé par "+127 demandes ce mois" → garder ça, dans un mini badge bleu pâle, **PAS un gros badge avec border**
- Grille 3x3 des catégories : cards petites, bordures minimales, état hover et selected propres
- Bouton Continuer orange plein largeur, taille standard

### 7. ANIMATIONS

Garder les animations actuelles framer-motion mais s'assurer qu'elles restent SOBRES :

- Fade-up sections au scroll : OK garder
- Hover lift sur cards : réduire à translate-y-1px seulement, pas 2px (trop marqué)
- Compteurs incrémentés stats : OK garder

---

## Hiérarchie d'autorité STRICTE

1. Maquette `docs/references/landing_page_particuliers.png` = SPEC PIXEL-NEAR
2. Si tu hésites entre "améliorer" et "reproduire fidèlement" → reproduire fidèlement
3. Aucune card avec border-radius > 8px sauf si la maquette le montre explicitement
4. Aucune ombre marquée (shadow-lg, shadow-xl) sauf hero form
5. Aucun fond coloré derrière une icône (pas de carré bleu pâle, pas de cercle de couleur)
6. Icônes Lucide en stroke-width 1.75, monochromes, pas dans des bulles colorées

---

## Livrable

Met à jour les composants `Hero.jsx`, `Stats.jsx`, `Categories.jsx`, `Testimonials.jsx` en priorité.

Garde le reste tel quel (Header, HowItWorks, B2B, WalloniaBanner, Footer) qui sont déjà bons.

Mets à jour `design-tokens.md` si tu fais varier des tokens visuels.

---

## Avant de coder

Confirme que tu comprends :

- Photo hero SANS cadre arrondi, intégrée au fond
- Slogan en bleu marine sur fond clair (PAS blanc sur sombre)
- Suppression du bandeau bleu top
- Stats en bande horizontale (pas 4 cards séparées)
- Categories sans carré coloré derrière l'icône, bandeau horizontal 9 items
- Témoignages avec photo ronde + étoiles colorées
- Card form simplifiée, moins de bordure marquée

Si tu hésites sur un détail, demande avant de coder. Je préfère 1 question maintenant que 5 itérations derrière.
