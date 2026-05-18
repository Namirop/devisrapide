import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Logo : picto PNG + wordmark HTML. Le PNG actuel (public/logo/logo.png)
// est le full size cleane par Kamel — next/image se charge du resize.

// ===== NUDGE D'ALIGNEMENT VERTICAL =====
// Ajuste ces valeurs (en px, positif = vers le bas) pour aligner visuellement
// l'icône et la wordmark avec le nav du header. Le PNG du picto a du whitespace
// non symétrique donc on compense ici. Modifie et reload pour voir le résultat.
const ICON_NUDGE_Y = 4; // ex: 2 pour descendre l'icône de 2px
const WORDMARK_NUDGE_Y = 4; // ex: 3 pour descendre "DevisRapide" de 3px
// ========================================

type LogoTheme = "light" | "dark";

export function Logo({
  size = 36,
  showText = true,
  theme = "light",
  href = "/",
  className,
  wordmarkClassName,
}: {
  size?: number;
  showText?: boolean;
  theme?: LogoTheme;
  href?: string | null;
  className?: string;
  wordmarkClassName?: string;
}) {
  const inner = (
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
