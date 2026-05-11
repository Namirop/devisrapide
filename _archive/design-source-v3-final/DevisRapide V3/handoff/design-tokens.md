# DevisRapide — Design Tokens

Tokens for the public landing page (B2C particuliers). Intended for **Next.js 16 + Tailwind v4 + shadcn/ui**.

## Brand

| Token | Value | Use |
| --- | --- | --- |
| `--color-primary` | `#1e3a8a` | Navy. Header logo, primary CTAs, focus rings, B2B section bg, footer bg |
| `--color-primary-hover` | `#1e40af` | Primary hover |
| `--color-accent` | `#ea580c` | Orange. "Demander un devis" CTA, "Continuer", "Simuler mes aides", category active state, accent text "à quinze numéros" |
| `--color-accent-hover` | `#c2410c` | Accent hover |

Slogan accent uses `#fb923c` (orange-400) on dark photo overlay for contrast — `#ea580c` would be too saturated against the navy gradient.

## Neutrals (Tailwind slate scale)

| Token | Value |
| --- | --- |
| `--color-background` | `#ffffff` |
| `--color-foreground` | `#0f172a` (slate-900) |
| `--color-muted` | `#f8fafc` (slate-50) |
| `--color-muted-fg` | `#64748b` (slate-500) |
| `--color-border` | `#e2e8f0` (slate-200) |

## Semantic

| Token | Value | Use |
| --- | --- | --- |
| `--color-success` | `#16a34a` | Inline check icons ("Sans inscription · Gratuit · Réponse rapide") |
| `--color-trustpilot` | `#00b67a` | Trustpilot star squares |
| `--color-star` | `#fbbf24` (amber-400) | Testimonial 5-star rating |
| `--color-wallonie-bg` | `#fef9c3` (yellow-100) | Primes banner background |

## Typography

- **Family**: Inter (`400 / 500 / 600 / 700`) — single family, no display secondary.
- **Base size**: 14–15 px body. Hero headline scales 40 → 54 px desktop. Section H2: 22–24 px. Card H3: 19–20 px.
- **Tracking**: `-0.02em` on H1/H2 (tracking-tight).
- **Weights**: 400 body, 500 navigation/eyebrows, 600 stat labels and section H3s, 700 H1/H2 and stat numbers.

## Radii (shadcn defaults)

| Token | Value | Use |
| --- | --- | --- |
| `--radius-sm` | 4 px | Badges |
| `--radius` | **6 px** | Buttons, inputs, category tiles |
| `--radius-md` | 8 px | Pay badges, small chips |
| `--radius-lg` | 12 px | Cards, photo frames, hero image |

## Shadows

| Token | Use |
| --- | --- |
| `--shadow-sm` | Stats card, category tile hover, testimonials |
| `--shadow` | Buttons |
| `--shadow-md` | B2B section card |
| `--shadow-lg` | Hero photo frame |
| `--shadow-xl` | Hero form card (the floating one on the right) |

Shadows are intentionally light — shadcn aesthetic, not material.

## Spacing rhythm

- Container max-width: **1200 px**, side padding 24 px.
- Section vertical padding: `py-10 lg:py-14`. Bottom of B2B / Categories: `pb-12 lg:pb-16`.
- Card padding: 24–28 px (`p-6 / p-7`). Hero form: 24 / 28 px.
- Touch target minimum: 40 px (buttons `h-10`).

## Iconography

- **lucide-react** at stroke-width `1.75`. Size 20 default, 16 inline-text, 22 in tiles, 14 in nav chevrons.
- For the prototype the icons are inlined as React SVG (`components/Icons.jsx`). In Next.js replace with `import { Home, Wrench, ... } from "lucide-react"` — prop signature is identical.

## Animations

- **framer-motion** in production. Prototype uses a thin `<Reveal>` wrapper backed by IntersectionObserver — same `delay` prop, same effect (fade + 16 px translate-Y, 600 ms cubic-bezier(0.22,1,0.36,1)).
- Hover lift: `translateY(-2 px)` + `shadow-md` over 220 ms on category tiles and testimonials.
- No bounces, no springs.

## Belgium-specific

- Postal codes: 4 digits (form step 2).
- VAT format: `BE 0XXX.XXX.XXX` (footer).
- Phone format: `02 XXX XX XX` (placeholder until launch).
- Currency: `€` with non-breaking space (`3,50 €`).
- Flag: SVG (`<BEFlag>`) — never emoji 🇧🇪 in production CSS, since cross-platform rendering is inconsistent on Windows. Top blue bar in `index.html` keeps the emoji-style SVG for brand recognition.

## Component mapping (shadcn)

| Local component | shadcn equivalent |
| --- | --- |
| `Button` | `@/components/ui/button` |
| `Card` | `@/components/ui/card` |
| `Badge` | `@/components/ui/badge` |
| Form fields (step 2) | `Input`, `Select`, `RadioGroup` |
| `Reveal` | `motion.div` with `whileInView` |
