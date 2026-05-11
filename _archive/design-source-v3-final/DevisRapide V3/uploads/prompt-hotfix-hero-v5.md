# Hero V5 — repositionner la photo et le form

Le rendu V5 est sur la bonne voie : la photo est plein bleed à droite avec le visage visible, le form est superposé. Bien.

Mais il reste un problème : **le form recouvre l'artisan**. Sur la maquette, l'artisan est entièrement visible **à gauche du form**, pas derrière.

---

## Correction à faire

### Repositionner photo et form

Actuellement :
- Photo occupe toute la moitié droite (50% du hero)
- Form posé par-dessus la photo, ce qui cache l'artisan

Cible :
- L'artisan doit être **entièrement visible à gauche du form**
- Le form se place **à la droite de l'artisan**, sans le recouvrir
- Photo et form **côte à côte**, pas superposés

Pour y arriver :
1. **Réduire la largeur de la photo** : elle n'occupe plus 50%, mais environ 35-40% du hero, juste assez pour montrer l'artisan
2. **Décaler l'artisan** dans le cadre photo pour qu'il soit centré ou légèrement décalé à gauche, visage et corps complets visibles, sans être tronqué par le form
3. **Placer le form à droite de la photo**, dans son propre espace (~ 40-45% de largeur du hero), avec un petit gap entre les deux
4. **Réduire la hauteur du hero** : actuellement la photo est trop grande verticalement (le hero fait trop de hauteur, on doit deviner les sections suivantes en bas du viewport). Hauteur cible : environ 580-620px desktop, pas 700+

### Ce qui change concrètement

```
Zone gauche (texte)    Photo artisan     Form card
~30% largeur            ~30-35% largeur   ~30-35% largeur
                                          
[Badge orange]         [Artisan          [Form blanc]
La plateforme N°1...    debout visible    Décrivez votre besoin
                        en entier         Stepper 1-2-3
Le bon artisan,         dans son atelier  Catégories grille
sans téléphoner         photo réduite     Continuer
à quinze numéros.       en largeur        Trust line
                        pas tronqué]      
Sous-texte                                
                                          
Trust badges                              
Trustpilot + Belge                        
```

### Précisions importantes

- **C'est OK qu'il y ait du blanc visible à droite et à gauche de la photo** dans la zone hero. La photo n'est pas obligée de prendre toute la hauteur du hero ni toute la moitié droite. Le fond slate-50 visible autour de la photo est volontaire et propre.
- **Pas besoin** de surdimensionner le hero pour cacher les sections suivantes. C'est OK si la section "Stats" est partiellement visible en bas du viewport au scroll initial. Au contraire, ça invite au scroll.
- Le form garde ses caractéristiques : card blanche, shadow visible (pas excessif), bordure subtile.
- L'artisan reste cropped pour montrer **visage + buste + tablier** (genre cadrage poitrine vers le haut). Pas en pied (trop petit), pas juste visage (trop intime).

---

## Ce que tu NE touches PAS

Toutes les autres sections restent intactes : Header, Stats, HowItWorks, WalloniaBanner, Categories, B2BSection, Testimonials, Footer.

---

## Livrable

Met à jour UNIQUEMENT `components/Hero.jsx`. Tous les autres fichiers restent intacts.

---

## Avant de coder

Confirme que tu comprends :
- Photo plus étroite, l'artisan reste entièrement visible
- Form à droite de la photo, pas superposé
- Hauteur du hero réduite (~580-620px desktop)
- Du blanc/slate-50 visible autour est OK et voulu
