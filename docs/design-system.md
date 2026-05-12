# DevisRapide — Design System

Reference du DS pose pendant le Sprint Design Refactor. Document d'usage : tokens, composants, patterns reutilisables, regles.

Voir aussi `docs/conventions.md` pour les conventions de code generales.

---

## 1. Tokens

### Palette

Stockes dans `src/app/globals.css` (`@theme inline` + `:root`).

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#1e3a8a` | Navy. Titres, CTA secondaires, focus, identite. |
| `accent` | `#ea580c` | Orange chaud. CTA principal, SOS, signal urgent. |
| `accent-hover` | `#c2410c` | Hover state du CTA accent. |
| `b2b-dark` | `#0f1e3d` | Section B2B + tuiles Stats (interieur). |
| `(B2B inner)` | `#1a2950` | Variante plus claire sur fond dark (tuiles, cards opaques). |
| `(accent on dark)` | `#fb923c` | Orange-400 chauffe, icones sur fond `b2b-dark` (evite le neon). |
| `wallonie-red` | `#ce1126` | Rouge ecusson Wallonie. |
| `wallonie-yellow` | `#fcd116` | Jaune ecusson Wallonie. |
| `wallonie-bg` | `#fef9c3` | Fond banniere primes Wallonie. |
| `trustpilot` | `#00b67a` | Vert Trustpilot. Exclusif au badge. |
| `star` | `#fbbf24` | Etoiles notes (non-Trustpilot). |
| `success` | `#16a34a` | Vert validation, confirmation. |
| `destructive` | `#dc2626` | Rouge erreur. |
| `border` | `#e2e8f0` | slate-200. Bordures par defaut. |

Neutres : palette `slate` Tailwind (slate-50 a slate-900). slate-50 (`#f8fafc`) utilise comme respiration entre sections claires.

### Typo

- Famille : **Inter** (loaded via `next/font/google`).
- Weights : 400 (regular), 500 (medium), 600 (semibold), 700 (bold).
- Feature settings : `cv11 ss01 ss03` actives globalement.
- Pas de display font. Une seule famille pour toute la landing et le produit.

### Radii

- `--radius: 6px` (base).
- `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl` derives.
- Convention DS : `rounded-md` (8px) par defaut pour cards/inputs ; `rounded-full` pour pills/avatars ; `rounded-none` accepte sur cards "techniques" (etape wizard) si le ton editorial l'impose.

### Shadows

- `--shadow-sm` : `0 1px 2px 0 rgb(0 0 0 / 0.04)`. Cards passifs.
- `--shadow` : carte standard hover.
- `--shadow-md` : modal/popover ferme.
- `--shadow-lg` : modal ouvert / form hero.
- `--shadow-xl` : reservation, peu utilise au launch.

### Spacing

Echelle Tailwind par defaut. Container max-width landing : **`max-w-[1350px]`** (defini en dur dans chaque section, pas de token dedie).

---

## 2. Composants DS (`src/components/ds/`)

Composants metier reutilisables, distincts des primitifs shadcn (`src/components/ui/`).

| Composant | Description | Props clefs |
|---|---|---|
| `Header` | Header sticky landing : logo + nav + CTA accent. Pas de submenu V1. | — |
| `Footer` | Footer DS navy `#0f1f4d` 4 colonnes (services, regions, espace pro, devisrapide). Reutilise sur toutes les pages publiques + legales. | — |
| `Logo` | Picto PNG + wordmark HTML. Sizing via `size` prop. | `size?`, `showText?`, `theme?` (light/dark), `href?` |
| `Hero` | Hero landing : texte gauche, photo artisan bornee centre, FormCard droite. Overlay blanc en gradient sur la photo (pas de mask-image transparent). | — |
| `Stats` | Bande horizontale 4 stats. Tuiles interieures sur fond `#1a2950` + icones orange-400 + valeurs blanches sur landing claire. | — |
| `HowItWorks` | 3 etapes en ligne (numero + icone + titre + description) avec flèches SVG inline entre etapes. ProCallout navy a droite. | — |
| `ProCallout` | Card CTA navy a droite de HowItWorks ("Vous etes un professionnel ?"). | — |
| `WalloniaBanner` | Banniere primes Region Wallonne (ecusson coq + copy + CTA + 3 bullets). Bg jaune `#fef9c3`. | — |
| `Categories` | Grille 9 metiers populaires, effet tableau (gap + bg slate-200 pour separateurs internes). Tuile SOS en rouge avec pill "24/7". | — |
| `B2BSection` | Section B2B & Coproprietes : card navy `#1e3a8a` avec SVG immeubles, CTA disable "Bientot disponible". | — |
| `Testimonials` | Bande Trustpilot fine au-dessus + 3 temoignages clients. | — |
| `TrustpilotBadgeCompact` | Mini-badge Trustpilot (stars + note + divider + logo). Variante compacte hero. | `rating?`, `reviewCount?` |
| `TrustpilotStar` | Etoile carre verte Trustpilot SVG. Variante `half` pour demi-etoile. | `size?`, `half?` |
| `GoldStar` | Etoile pleine doree (non-Trustpilot). | `size?` |
| `BEFlag` | Drapeau belge SVG inline. | `className?` |
| `WalloniaRooster` | Coq wallon SVG. | `className?` |
| `Reveal` | Wrapper framer-motion fade-up au scroll. Respecte `prefers-reduced-motion`. | `delay?`, children |

---

## 3. Patterns reutilisables

### Section wrapper full-width / container interne

Toutes les sections landing suivent ce schema :

```tsx
<section className="bg-white"> {/* ou bg-slate-50, ou rien (transparent pour grille globale) */}
  <div className="mx-auto max-w-[1350px] px-6 py-X">
    {/* contenu */}
  </div>
</section>
```

Le wrapper `<section>` controle le fond pleine largeur ; le `<div>` interne controle la largeur de contenu et le padding vertical.

### Alternance backgrounds landing

Pattern de rythme vertical (cf. §3 du Sprint Design Refactor) :

```
Hero            transparent (grille visible)
Stats           transparent (grille visible, tuiles dark a l'interieur)
HowItWorks      transparent (grille visible)
WalloniaBanner  bg-slate-50 (panneau gris opaque, couvre la grille)
Categories      transparent (grille visible)
B2BSection      bg-slate-50 (panneau gris opaque, couvre la grille)
Testimonials    transparent (grille visible)
```

Regles :
- Jamais deux sections `bg-slate-50` collees.
- Maximum une section dark `b2b-dark` sur toute la landing (si introduite).
- Coupe nette entre sections, pas de divider/SVG wave.

### Pattern grille `.bg-grid-pattern`

Classe globale CSS dans `globals.css` :

```css
.bg-grid-pattern {
  background-image:
    linear-gradient(to right, rgb(226 232 240 / 0.35) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(226 232 240 / 0.35) 1px, transparent 1px);
  background-size: 48px 48px;
}
```

Applique en **couche unique globale** dans `src/app/(public)/page.tsx` (wrapper relative + div absolute inset-0 avec `pointer-events-none`). Pas de pattern par section : evite les carres coupes aux limites.

Sections grises (`bg-slate-50` avec `relative` pour entrer dans la stacking order) couvrent la grille comme panneaux opaques.

### Eyebrow editorial

Pre-titre uppercase orange petit, ton "labellise" :

```tsx
<span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ea580c]">
  Demande envoyee
</span>
```

Utilise sur `/demande/confirmation`. Pattern reutilisable pour toute section a "annoncer" (futurs CTAs, sections produit, etc.).

---

## 4. Composants UI (`src/components/ui/`)

Primitifs shadcn etendus.

| Composant | Variants notables |
|---|---|
| `Button` | `default` (navy primary), `accent` (orange CTA principal), `outline` (border slate), `outline-white` (fond dark), `ghost`, `secondary`, `destructive`, `link`. Sizes : `xs`, `sm`, `default`, `lg`, `icon-*`. |
| `Form` + `FormField` + `FormItem` + `FormLabel` + `FormMessage` + `FormControl` | shadcn install manuel (base-nova ne l'expose pas). `FormMessage` rend le texte d'erreur en `destructive` (rouge sobre). TODO Sprint 5 : icone `AlertCircle` prefixe. |
| `Input`, `Textarea` | Border slate-200, focus ring navy. |
| `RadioGroup` + `RadioGroupItem` | Base-ui. Sur cards custom (wizard step 4), `RadioGroupItem` wrappe dans un `<span absolute h-0 w-0>` pour le retirer du flex flow (sr-only seul ne suffit pas en cas de conflit tailwind-merge avec les classes base-ui internes). |
| `Card`, `Dialog`, `Select`, `Label`, `Badge`, `Sonner` | shadcn defaults, palette adaptee. |

---

## 5. Regles "ce qu'on ne fait pas"

A garder en tete pour ne pas glisser vers le template SaaS generique :

- **Pas de glass blur AI-aesthetic** (`backdrop-blur` + bg-white/5). Reserve aux modals si vraiment necessaire. Sur tuiles/cards on prefere `bg-[#1a2950]` opaque.
- **Pas de gradient flashy** dans la palette (degrades horizontaux fluo, mesh gradients colorimetriques). Les seuls gradients accepted : overlay blanc sur photo hero (technique), gradient subtil ProCallout.
- **Pas de hover-lift sur tout**. Reserve aux cards d'action principales (Step 1 Univers wizard). Sur tuiles passives, hover = border-300 + bg-slate-50 simple.
- **Pas de pattern decoratif lourd**. Le pattern grille `.bg-grid-pattern` est volontairement minimal (slate-200 a 35% opacity). Pas de motifs vermillon, pas de blobs, pas de waves SVG inter-sections.
- **Pas de nouvelle police**. Inter seul. Pas de display font, pas de monospace en heading.
- **Pas de couleur hors palette validee Kamel**. Si une nouvelle couleur semble necessaire, on stop & ask.
- **Pas d'emoji decoratif** dans la copie ou les boutons. Icones lucide uniquement.
- **Pas de typo italique** sauf citations explicites (et encore).

La sobriete editoriale fait la signature du produit. Le "service belge serieux" passe par la retenue, pas par l'ornement.
