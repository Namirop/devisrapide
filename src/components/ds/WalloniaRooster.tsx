// Coq wallon (silhouette rouge sur fond jaune écusson) — simplifié.

export function WalloniaRooster({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-label="Coq wallon"
      role="img"
    >
      <rect width="100" height="100" fill="#fcd116" />
      <g fill="#dc2626">
        <path d="M28 55 C28 40, 45 30, 58 32 L65 28 L67 34 L72 34 L70 40 C76 44, 78 52, 76 60 L82 62 L78 66 L80 72 L72 70 L72 76 L66 72 L60 78 L56 72 L48 76 L46 70 L38 72 L40 64 L32 62 Z" />
        <path d="M62 26 L66 22 L68 28 L72 24 L72 32 Z" />
        <rect x="48" y="76" width="3" height="8" />
        <rect x="58" y="76" width="3" height="8" />
        <path d="M44 84 L54 84 L52 86 L46 86 Z" />
        <path d="M54 84 L64 84 L62 86 L56 86 Z" />
        <path d="M26 50 C18 48, 16 56, 22 62 C18 66, 22 70, 28 66 Z" />
      </g>
    </svg>
  );
}
