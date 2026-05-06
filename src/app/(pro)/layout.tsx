import Link from "next/link";

import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function ProLayout({
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
            <Link href="/pro" className="font-semibold">
              DevisRapide Pro
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/pro" className="hover:underline">
                Tableau de bord
              </Link>
              <Link href="/pro/leads" className="hover:underline">
                Mes leads
              </Link>
              <Link href="/pro/wallet" className="hover:underline">
                Wallet
              </Link>
              <Link href="/pro/parametres" className="hover:underline">
                Paramètres
              </Link>
            </nav>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
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
