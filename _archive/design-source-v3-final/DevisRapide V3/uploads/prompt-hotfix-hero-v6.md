# Hero V6 — fusion photo + form + fond

V6 est presque bon, l'artisan est au bon endroit et le form est bien dimensionné. Mais il reste un problème de fusion visuelle : la photo paraît isolée, posée sur le fond comme un sticker. Sur la maquette, la photo et le form sont **intégrés** au fond grâce à des dégradés et un léger chevauchement.

---

## 3 corrections précises

### 1. Augmenter la taille de la photo

Actuellement la photo est trop modeste, l'artisan paraît petit dans le hero. À corriger :
- Largeur de la photo : ~38-42% du hero (au lieu de ~30%)
- Hauteur : remplit toute la hauteur disponible du hero, du haut au bas
- L'artisan doit être visuellement **imposant**, c'est le sujet principal

### 2. Fondre la photo dans le fond slate-50

Actuellement la photo a des bords nets, on voit clairement où elle commence et où elle finit. Sur la maquette, elle se fond progressivement avec le fond.

À ajouter :
- **Gradient sur le bord gauche** de la photo : `linear-gradient(to right, #f8fafc 0%, transparent 100%)` sur ~100px de large, qui crée une transition douce de slate-50 vers la photo
- **Gradient sur le bord bas** de la photo (subtil) : `linear-gradient(to top, #f8fafc 0%, transparent 30%)` sur ~60px, pour atténuer la coupure basse si elle existe

Ces gradients sont des `::before` ou des `<div>` overlay sur la photo, pas une modification du fichier image.

### 3. Chevauchement form / photo

Actuellement le form est complètement à droite du hero, avec un grand espace blanc entre l'artisan et le form. Sur la maquette, **le form chevauche légèrement la photo**.

À corriger :
- Déplacer le form vers la gauche pour qu'il **touche le bord droit de l'artisan** ou qu'il **passe légèrement par-dessus** (overlap d'environ 40-60px sur la photo)
- **Étendre l'atelier (la photo) à droite derrière le form** : la photo doit continuer derrière le form, pas s'arrêter au bord du form. Soit on agrandit la photo jusqu'au bord droit du hero, soit on duplique/étend la zone "atelier flou" derrière le form en background.
- Le résultat : on doit voir le fond d'atelier flou **autour et derrière** le form, pas du blanc slate-50 plat à droite

Concrètement :
```
[Texte gauche]   [Photo artisan grande]  ┌──────────┐
                                          │   Form   │ ← le form chevauche
                                          │  (avec  │   la photo droite,
                                          │  shadow) │   l'atelier flou
                                          └──────────┘   continue derrière
                                          [atelier flou continue]
```

---

## Ce qui reste inchangé

- Position de l'artisan dans son cadre (visage visible, bras croisés, etc.) : OK
- Taille du form, contenu du form, stepper, grille catégories : OK
- Bloc texte gauche (badge, slogan, sous-texte, trust badges, Trustpilot, Belge) : OK
- Hauteur du hero (~580-620px) : OK, garder ce qu'on a

---

## Ce que tu NE touches PAS

Toutes les autres sections : Header, Stats, HowItWorks, WalloniaBanner, Categories, B2BSection, Testimonials, Footer.

---

## Livrable

Met à jour UNIQUEMENT `components/Hero.jsx`.

---

## Avant de coder

Confirme que tu comprends :
- Photo plus grande (~38-42% du hero en largeur)
- Gradients slate-50 → transparent sur les bords gauche (et bas léger) pour fondre
- Form décalé vers la gauche, chevauche la photo
- Atelier flou continue derrière le form (pas de blanc plat à droite)
