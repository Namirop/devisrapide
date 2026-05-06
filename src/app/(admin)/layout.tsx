import Link from "next/link";

import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <>
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold">
              DevisRapide Admin
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/admin" className="hover:underline">
                Dashboard
              </Link>
              <Link href="/admin/pros" className="hover:underline">
                Pros
              </Link>
              <Link href="/admin/leads" className="hover:underline">
                Leads
              </Link>
              <Link href="/admin/catalogue" className="hover:underline">
                Catalogue
              </Link>
              <Link href="/admin/wallet" className="hover:underline">
                Wallet
              </Link>
              <Link href="/admin/audit" className="hover:underline">
                Audit
              </Link>
              <Link href="/admin/config" className="hover:underline">
                Config
              </Link>
            </nav>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/connexion" });
            }}
          >
            <span className="mr-3 text-sm text-muted-foreground">
              {session?.user.email}
            </span>
            <Button type="submit" variant="ghost" size="sm">
              Déconnexion
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </>
  );
}
