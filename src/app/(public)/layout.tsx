// Layout (public) — chrome partagé. Header sera ajouté à l'intégration
// finale (commit 11). Footer arrivera au même moment.
// Preload LCP du hero pour préserver le score LCP.

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/images/hero-artisan-800.webp"
        type="image/webp"
      />
      <main className="flex-1">{children}</main>
    </>
  );
}
