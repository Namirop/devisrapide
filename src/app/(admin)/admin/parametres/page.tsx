import type { Metadata } from "next";

import { UpdateAdminEmailForm } from "@/components/admin/parametres/UpdateAdminEmailForm";
import { UpdateAdminPasswordForm } from "@/components/admin/parametres/UpdateAdminPasswordForm";
import { requireAdminSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Paramètres du compte — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminParametresPage() {
  const { userId } = await requireAdminSession();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true },
  });

  return (
    <main className="px-5 pt-4 pb-6 sm:px-10 sm:pt-5 sm:pb-8">
      <header className="mb-8">
        <h1 className="font-display text-[28px] font-bold tracking-tight text-slate-900 lg:text-[34px]">
          Paramètres du compte
        </h1>
        <p className="mt-1 text-[14.5px] text-slate-600">
          Modifiez votre adresse email et votre mot de passe. Chaque
          changement nécessite votre mot de passe actuel.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Modifier mon email">
          <UpdateAdminEmailForm currentEmail={user?.email ?? ""} />
        </Card>

        <Card title="Modifier mon mot de passe">
          <UpdateAdminPasswordForm />
        </Card>
      </div>
    </main>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-display mb-5 text-[18px] font-bold text-slate-900">
        {title}
      </h2>
      {children}
    </section>
  );
}
