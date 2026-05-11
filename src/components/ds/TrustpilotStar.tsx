// Étoile Trustpilot (carré vert avec étoile blanche découpée).
// Reproduction visuelle — pas de widget officiel intégré.
// Prop `half` : gradient 50/50 vert + gris (note avec demi-étoile).

export function TrustpilotStar({
  size = 20,
  half = false,
}: {
  size?: number;
  half?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ display: "block" }}
      aria-hidden
    >
      {half && (
        <defs>
          <linearGradient id="tp-half">
            <stop offset="50%" stopColor="#00b67a" />
            <stop offset="50%" stopColor="#dcdce6" />
          </linearGradient>
        </defs>
      )}
      <rect
        width="24"
        height="24"
        fill={half ? "url(#tp-half)" : "#00b67a"}
        rx="2"
      />
      <polygon
        points="12,4.5 14.12,9.12 19.2,9.6 15.36,12.96 16.56,18 12,15.3 7.44,18 8.64,12.96 4.8,9.6 9.88,9.12"
        fill="white"
      />
    </svg>
  );
}
