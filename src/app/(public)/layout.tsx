import Link from "next/link";
import { NavPublic } from "@/components/ds/NavPublic";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavPublic />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border bg-muted">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} DevisRapide.be</p>
          <nav className="flex flex-wrap gap-4">
            <Link href="/mentions-legales" className="hover:text-foreground">
              Mentions légales
            </Link>
            <Link href="/cgu-clients" className="hover:text-foreground">
              CGU clients
            </Link>
            <Link href="/cgu-pros" className="hover:text-foreground">
              CGU pros
            </Link>
            <Link href="/confidentialite" className="hover:text-foreground">
              Confidentialité
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
