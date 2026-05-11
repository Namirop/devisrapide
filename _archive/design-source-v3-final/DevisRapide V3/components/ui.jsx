// Shared UI primitives — shadcn-style.

const cn = (...a) => a.filter(Boolean).join(" ");

const Button = ({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  children,
  ...rest
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-md " +
    "transition-all duration-200 focus-visible:outline-none " +
    "disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap";
  const sizes = {
    sm: "h-8 px-3 text-[13px]",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-[15px]",
    xl: "h-14 px-7 text-base",
  };
  const variants = {
    primary:
      "bg-[#1e3a8a] text-white hover:bg-[#1e40af] shadow-sm",
    accent:
      "bg-[#ea580c] text-white hover:bg-[#c2410c] shadow-sm",
    outline:
      "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
    "outline-white":
      "border border-white/40 bg-transparent text-white hover:bg-white/10",
    ghost:
      "text-slate-700 hover:bg-slate-100",
    link:
      "text-[#1e3a8a] underline-offset-4 hover:underline",
  };
  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

const Card = ({ className = "", children, ...rest }) => (
  <div
    className={cn(
      "bg-white border border-slate-200 rounded-lg",
      className
    )}
    {...rest}
  >
    {children}
  </div>
);

const Badge = ({ className = "", children, ...rest }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium",
      className
    )}
    {...rest}
  >
    {children}
  </span>
);

// IntersectionObserver fade-up wrapper.
// Stand-in for framer-motion's `motion.div + whileInView`.
const Reveal = ({ children, delay = 0, as = "div", className = "" }) => {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setTimeout(() => el.classList.add("is-visible"), delay);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  const Tag = as;
  return (
    <Tag ref={ref} className={cn("reveal", className)}>
      {children}
    </Tag>
  );
};

// Belgian flag in SVG (no emoji)
const BEFlag = ({ className = "" }) => (
  <svg viewBox="0 0 3 2" className={className} aria-label="Drapeau belge">
    <rect width="1" height="2" x="0" fill="#000000" />
    <rect width="1" height="2" x="1" fill="#FAE042" />
    <rect width="1" height="2" x="2" fill="#ED2939" />
  </svg>
);

// Wallonia rooster (red coq hardi on yellow) — simplified silhouette
const WalloniaRooster = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Coq wallon">
    <rect width="100" height="100" fill="#fcd116" />
    <g fill="#dc2626">
      {/* body */}
      <path d="M28 55 C28 40, 45 30, 58 32 L65 28 L67 34 L72 34 L70 40 C76 44, 78 52, 76 60 L82 62 L78 66 L80 72 L72 70 L72 76 L66 72 L60 78 L56 72 L48 76 L46 70 L38 72 L40 64 L32 62 Z"/>
      {/* comb */}
      <path d="M62 26 L66 22 L68 28 L72 24 L72 32 Z"/>
      {/* legs */}
      <rect x="48" y="76" width="3" height="8"/>
      <rect x="58" y="76" width="3" height="8"/>
      <path d="M44 84 L54 84 L52 86 L46 86 Z"/>
      <path d="M54 84 L64 84 L62 86 L56 86 Z"/>
      {/* tail */}
      <path d="M26 50 C18 48, 16 56, 22 62 C18 66, 22 70, 28 66 Z"/>
    </g>
  </svg>
);

// Trustpilot star (filled green square with white star cutout)
const TrustpilotStar = ({ size = 20, half = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <rect width="24" height="24" fill={half ? "url(#tp-half)" : "#00b67a"} rx="2"/>
    {half && (
      <defs>
        <linearGradient id="tp-half">
          <stop offset="50%" stopColor="#00b67a" />
          <stop offset="50%" stopColor="#dcdce6" />
        </linearGradient>
      </defs>
    )}
    <polygon
      points="12,4.5 14.12,9.12 19.2,9.6 15.36,12.96 16.56,18 12,15.3 7.44,18 8.64,12.96 4.8,9.6 9.88,9.12"
      fill="white"
    />
  </svg>
);

// Gold star (rating)
const GoldStar = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fbbf24" style={{ display: "block" }}>
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
  </svg>
);

Object.assign(window, { cn, Button, Card, Badge, Reveal, BEFlag, WalloniaRooster, TrustpilotStar, GoldStar });
