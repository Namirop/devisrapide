import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Logo : 2 variantes
//
//   variant="mark" (default) : picto carré PNG (public/logo/logo.png) +
//   wordmark texte HTML. Sert tous les fonds sombres via theme="dark" +
//   filter CSS brightness-0 invert appliqué par le parent au besoin
//   (cf. Footer). Conserve les nudges historiques (whitespace asymétrique
//   du PNG d'origine).
//
//   variant="brand" : nouveau logo horizontal (public/logo/logo-brand.png)
//   contenant picto + wordmark "DevisRapide.be" intégrés. Image bleue sur
//   fond clair UNIQUEMENT — pas de support theme dark. Le prop `size` est
//   réinterprété comme hauteur (width auto, ratio préservé). `showText` et
//   `wordmarkClassName` sont ignorés car le wordmark vit dans l'image.

// ===== NUDGE D'ALIGNEMENT VERTICAL (variant="mark" uniquement) =====
// Ajuste ces valeurs (en px, positif = vers le bas) pour aligner visuellement
// l'icône et la wordmark avec le nav du header. Le PNG du picto a du whitespace
// non symétrique donc on compense ici. Modifie et reload pour voir le résultat.
const ICON_NUDGE_Y = 4; // ex: 2 pour descendre l'icône de 2px
const WORDMARK_NUDGE_Y = 4; // ex: 3 pour descendre "DevisRapide" de 3px
// ========================================

type LogoTheme = "light" | "dark";
type LogoVariant = "mark" | "brand";

export function Logo({
  size = 36,
  showText = true,
  theme = "light",
  variant = "mark",
  href = "/",
  className,
  wordmarkClassName,
}: {
  size?: number;
  showText?: boolean;
  theme?: LogoTheme;
  variant?: LogoVariant;
  href?: string | null;
  className?: string;
  wordmarkClassName?: string;
}) {
  const inner =
    variant === "brand" ? (
      <span
        className={cn("inline-flex items-center", className)}
        aria-label="DevisRapide"
      >
        <Image
          src="/logo/logo-brand.png"
          alt=""
          width={Math.round(size * (1207 / 235))}
          height={size}
          priority
          style={{ height: size, width: "auto" }}
        />
      </span>
    ) : (
      <span
        className={cn("inline-flex items-center gap-2.5", className)}
        aria-label="DevisRapide"
      >
        <Image
          src="/logo/logo.png"
          alt=""
          width={size}
          height={size}
          priority
          className="h-auto w-auto"
          style={{
            height: size,
            width: "auto",
            transform: `translateY(${ICON_NUDGE_Y}px)`,
          }}
        />
        {showText && (
          <span
            className={cn(
              "font-bold leading-none tracking-tight",
              size >= 56
                ? "text-[28px]"
                : size >= 44
                  ? "text-[22px]"
                  : size >= 36
                    ? "text-[18px]"
                    : "text-[15px]",
              theme === "dark" ? "text-white" : "text-[#1e3a8a]",
              wordmarkClassName,
            )}
            style={{ transform: `translateY(${WORDMARK_NUDGE_Y}px)` }}
          >
            DevisRapide
          </span>
        )}
      </span>
    );

  if (href === null) return inner;
  return (
    <Link href={href} aria-label="DevisRapide — Accueil">
      {inner}
    </Link>
  );
}
