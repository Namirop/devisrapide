# Hero V7 — ajuster le positionnement de la photo dans son cadre

V6 est très proche. Les fondus de bords sont bons, l'atelier flou continue bien derrière le form, et la composition générale fonctionne. **On garde tout ça**.

Il reste **un seul vrai problème** : le positionnement de l'artisan dans son cadre photo. Actuellement :
- La tête de l'artisan est **coupée au front** (on ne voit pas le haut du crâne)
- Le form passe **sur son torse/visage** au lieu d'être à hauteur d'épaule
- L'image est trop zoomée

---

## Ce qu'il faut ajuster

### Reposition de l'artisan dans le cadre photo

L'image source `assets/hero-artisan.jpg` contient l'artisan en pied avec tête complète et atelier autour. Il faut ajuster le `object-position` et/ou le cadrage pour :

1. **Faire descendre l'image** pour montrer le haut de la tête (front + cheveux visibles, plus de coupure au front)
   - Probablement `object-position: center 25%` ou `center 30%` (au lieu de center par défaut qui prend le milieu)
   
2. **Dézoomer légèrement** ou réduire la largeur du cadre photo pour que l'artisan apparaisse un peu plus petit
   - Soit `object-fit: contain` avec un cadre plus large
   - Soit garder `object-fit: cover` mais réduire la largeur du cadre photo (~33-36% au lieu de 38-42%)

3. **Décaler l'artisan vers la gauche dans son cadre** pour que le form vienne se poser sur son épaule droite, pas sur son visage/torse
   - Combiner avec `object-position` horizontal : par exemple `object-position: 30% 25%` (30% horizontal = artisan décalé à gauche dans le cadre)

### Cible visuelle

Le résultat attendu :
- Tête complète de l'artisan visible (cheveux, front, visage entier)
- Artisan placé légèrement à gauche dans son cadre photo
- Form posé à droite, son bord gauche tombe **sur l'épaule droite** de l'artisan (genre épaule visible, mais le bras / torse caché par le form)
- L'atelier flou continue à droite derrière le form (déjà OK en V6)

---

## Augmenter légèrement la hauteur du hero

Avec l'artisan repositionné, on peut aussi **augmenter un peu la hauteur du hero** (~660-700px desktop au lieu de ~580-620px) pour que :
- L'artisan ait plus de respiration verticale
- La photo paraisse plus imposante
- Le form ait plus de place

Mais pas trop : on doit toujours apercevoir le début de la section suivante (Stats) dans le viewport au scroll initial sur un écran 1080p standard.

---

## Ce qui reste inchangé

- Fondus des bords gauche et bas (gradients slate-50) : parfaits, garder
- Atelier flou qui continue derrière le form : parfait, garder
- Position du form (à droite, chevauche la photo) : OK
- Bloc texte gauche : intact
- Form contenu (stepper, grille, etc.) : intact

---

## Ce que tu NE touches PAS

Toutes les autres sections : Header, Stats, HowItWorks, WalloniaBanner, Categories, B2BSection, Testimonials, Footer.

---

## Livrable

Met à jour UNIQUEMENT `components/Hero.jsx`.

---

## Avant de coder

Confirme que tu comprends :
- Tête complète de l'artisan visible (pas de coupure au front)
- Artisan décalé à gauche dans son cadre photo
- Form se pose sur l'épaule droite, pas sur le visage/torse
- Hauteur hero légèrement augmentée (~660-700px)
- Fondus de bords et atelier flou derrière le form : on garde
