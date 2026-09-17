import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Deux variantes :
// - "mark" (défaut) : picto PNG + wordmark HTML ; theme="dark" pour les fonds
//   sombres, le parent pouvant blanchir le picto par filtre CSS (cf. Footer).
// - "brand" : logo horizontal PNG incluant le wordmark, pour fond clair
//   uniquement ; `size` fixe la hauteur, `showText` et `wordmarkClassName`
//   sont ignorés.

// Décalages verticaux en px (positif = vers le bas) : compensent les marges
// asymétriques du PNG pour aligner le logo sur la nav du header.
const ICON_NUDGE_Y = 4;
const WORDMARK_NUDGE_Y = 4;
// Le toit du picto dépasse en haut du PNG « brand » : le remonter recentre
// visuellement le wordmark sur la nav.
const BRAND_NUDGE_Y = -3;

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
  onClick,
}: {
  size?: number;
  showText?: boolean;
  theme?: LogoTheme;
  variant?: LogoVariant;
  href?: string | null;
  className?: string;
  wordmarkClassName?: string;
  onClick?: () => void;
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
          style={{
            height: size,
            width: "auto",
            transform: `translateY(${BRAND_NUDGE_Y}px)`,
          }}
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
    <Link href={href} aria-label="DevisRapide — Accueil" onClick={onClick}>
      {inner}
    </Link>
  );
}
