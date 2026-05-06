import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold">
            DevisRapide
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/demande" className="hover:underline">
              Demander un devis
            </Link>
            <Link href="/pros" className="hover:underline">
              Devenir pro
            </Link>
            <Link href="/connexion" className="hover:underline">
              Connexion
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} DevisRapide</p>
          <nav className="flex flex-wrap gap-4">
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/cgu-clients">CGU clients</Link>
            <Link href="/cgu-pros">CGU pros</Link>
            <Link href="/confidentialite">Confidentialité</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
