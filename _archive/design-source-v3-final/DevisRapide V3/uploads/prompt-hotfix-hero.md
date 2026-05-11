# Hotfix Hero — photo positioning

Le rendu V4 a un problème **majeur** sur le hero : la photo de l'artisan est mal positionnée et mal cropée. On corrige UNIQUEMENT le hero dans cette itération. Les autres sections restent intactes.

---

## Problème actuel

Dans Hero.jsx V4 :
- La photo de l'artisan est placée **en dessous du slogan**, dans le coin bas-gauche du bloc texte
- L'artisan est **cropped à partir de la poitrine** : son visage n'est pas visible, son regard non plus
- Résultat : la photo est devenue un élément décoratif, pas le sujet visuel du hero

## Ce qu'on veut

Dans la maquette de référence (docs/references/landing_page_particuliers.png) :
- La photo occupe la **moitié droite complète du hero**, plein bleed, du haut jusqu'en bas
- L'artisan est **debout, visible en pied (ou à mi-corps avec visage visible)**, regarde la caméra
- Le fond de l'atelier se fond visuellement avec le fond clair de la page sur la gauche (transition naturelle, pas de bordure dure)
- Le form blanc est **superposé par-dessus la photo à droite**, avec une ombre légère qui le fait flotter
- Pas de cadre arrondi autour de la photo, pas de shadow, juste une intégration naturelle

## Nouveau layout du hero

```
HERO COMPLET — fond slate-50

Zone gauche (50%)              Zone droite (50%)
─────────────────              ─────────────────
                               
[Badge orange]                 [PHOTO ARTISAN]
La plateforme N°1...           plein bleed, sans cadre
                               visage + buste + tablier
Le bon artisan,                fond atelier flou qui
sans téléphoner                se fond avec slate-50
à quinze numéros.              sur le bord gauche
(bleu marine + orange)         
                               ┌────────────────────┐
Sous-texte                     │ CARD FORM blanche  │
                               │ superposée droite  │
3 Trust badges                 │ shadow-lg légère   │
en ligne horizontale           │                    │
                               │ Décrivez besoin    │
Trustpilot + Belge             │ Stepper 1-2-3      │
                               │ Grille 3x3 cat     │
                               │ Continuer          │
                               └────────────────────┘
                               (la card OVERLAY sur photo)
```

## Spécifications précises

### Photo
- Source : `assets/hero-artisan.jpg` (existant)
- Position : occupe la moitié droite du hero (50% largeur), de la tranche supérieure du hero à la tranche inférieure
- `object-fit: cover` avec `object-position: center top` ou `center` pour que le visage de l'artisan soit visible
- **AUCUN border-radius**, AUCUN shadow sur la photo elle-même
- Hauteur du hero : au moins 600px lg, idéalement 700-720px desktop
- Sur le bord gauche de la photo : un gradient subtil de slate-50 → transparent, qui crée une transition douce entre la zone texte et la photo (largeur du gradient : ~100-150px)

### Form card
- Position : superposée à la photo, dans la moitié droite, alignée légèrement vers la droite avec un décalage du bord (~40-60px du bord droit)
- Verticalement centrée dans le hero
- Shadow plus marqué que ce que tu avais avant : `shadow-2xl` ou équivalent (la card doit flotter visuellement par-dessus la photo)
- Border : très subtile, juste 1px slate-200/30
- Border-radius : 12px max
- Largeur de la card : ~440-500px

### Bloc texte gauche
- Aligné à gauche, padding gauche raisonnable (max-w-[1200px] container + px-6)
- Verticalement centré dans le hero ou aligné en haut + sous-texte aligné au milieu (à ton choix selon ce qui rend mieux)
- Tous les éléments existants restent en place : badge orange, slogan 3 lignes (bleu marine + orange sur 3e ligne), sous-texte, 3 trust badges horizontaux, Trustpilot + Belge

### Sur mobile
- Stack vertical : badge + slogan + sous-texte + trust badges en haut, PUIS form, PUIS photo en bas (ou photo en background du bloc texte avec opacité, à ton choix)
- Pas de chevauchement photo/form sur mobile

## Ce que tu NE touches PAS

- Header.jsx : intact
- Stats.jsx : intact
- HowItWorks.jsx : intact
- WalloniaBanner.jsx : intact
- Categories.jsx : intact (on le traite à la prochaine itération)
- B2BSection.jsx : intact
- Testimonials.jsx : intact (on le traite à la prochaine itération)
- Footer.jsx : intact
- design-tokens.md : intact (sauf si tu ajoutes une convention pour le gradient slate-50 → transparent)
- globals.css : intact

## Hiérarchie d'autorité

1. Maquette `docs/references/landing_page_particuliers.png` = SPEC visuelle absolue pour le hero
2. Photo plein bleed à droite, visage visible, pas d'encart décoratif
3. Form superposé par-dessus la photo à droite
4. Si tu hésites entre "améliorer" et "reproduire fidèlement" → reproduire fidèlement

## Livrable

Met à jour UNIQUEMENT `components/Hero.jsx`. Tous les autres fichiers restent intacts.

## Avant de coder

Confirme que tu comprends :
- Photo plein bleed à droite (pas en encart sous le texte)
- Visage de l'artisan visible (recroper si nécessaire)
- Form superposé par-dessus la photo (card flottante avec shadow)
- Transition douce slate-50 → photo via gradient sur le bord gauche de la photo
- Pas de border-radius sur la photo elle-même
