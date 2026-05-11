import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";

const SIZE = {
  sm: { img: 28, wordmark: "text-base" },
  md: { img: 36, wordmark: "text-xl" },
  lg: { img: 52, wordmark: "text-2xl" },
} as const;

export function Logo({
  size = "md",
  className,
  href = "/",
  theme = "light",
}: {
  size?: LogoSize;
  className?: string;
  href?: string | null;
  theme?: "light" | "dark";
}) {
  const { img, wordmark } = SIZE[size];

  const inner = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/logo/logo.png"
        alt=""
        width={img}
        height={img}
        priority
        className="h-auto w-auto"
        style={{ height: img }}
      />
      <span
        className={cn(
          "font-bold tracking-tight",
          wordmark,
          theme === "dark" ? "text-white" : "text-primary",
        )}
      >
        DevisRapide<span className="text-accent">.be</span>
      </span>
    </span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} aria-label="DevisRapide — Accueil">
      {inner}
    </Link>
  );
}
