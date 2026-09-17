// Drapeau belge en SVG : l'emoji 🇧🇪 ne s'affiche pas sous Windows.

export function BEFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 3 2"
      className={className}
      aria-label="Drapeau belge"
      role="img"
    >
      <rect width="1" height="2" x="0" fill="#000000" />
      <rect width="1" height="2" x="1" fill="#FAE042" />
      <rect width="1" height="2" x="2" fill="#ED2939" />
    </svg>
  );
}
