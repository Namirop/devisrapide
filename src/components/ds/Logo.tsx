import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Logo : picto PNG + wordmark HTML. Le PNG actuel (public/logo/logo.png)
// est le full size cleane par Kamel — next/image se charge du resize.

type LogoTheme = "light" | "dark";

export function Logo({
  size = 36,
  showText = true,
  theme = "light",
  href = "/",
  className,
}: {
  size?: number;
  showText?: boolean;
  theme?: LogoTheme;
  href?: string | null;
  className?: string;
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
        style={{ height: size, width: "auto" }}
      />
      {showText && (
        <span
          className={cn(
            "font-bold tracking-tight",
            size >= 36 ? "text-[18px]" : "text-[15px]",
            theme === "dark" ? "text-white" : "text-[#1e3a8a]",
          )}
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
