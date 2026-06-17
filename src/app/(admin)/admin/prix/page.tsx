import type { Metadata } from "next";

import { CategoryPricingCard } from "@/components/admin/pricing/CategoryPricingCard";
import { requireAdminSession } from "@/lib/auth-guards";
import { getAdminPricingTree } from "@/server/queries/admin-pricing";

export const metadata: Metadata = {
  title: "Prix des leads — Admin",
  robots: { index: false, follow: false },
};

// Données fraîches après chaque modification (pas de cache).
export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  await requireAdminSession();
  const universes = await getAdminPricingTree();

  return (
    <main className="px-5 pt-4 pb-6 sm:px-10 sm:pt-5 sm:pb-8">
      <header className="mb-6">
        <h1 className="font-display text-[28px] font-bold tracking-tight text-slate-900 lg:text-[34px]">
          Prix des leads
        </h1>
        <p className="mt-1 max-w-2xl text-[14.5px] text-slate-600">
          Définissez le prix standard et exclusif par catégorie, avec
          override possible par sous-catégorie. Les modifications s&apos;appliquent
          aux <strong className="font-semibold">nouveaux leads</strong> ; les
          leads existants conservent leur prix.
        </p>
      </header>

      <div className="flex flex-col gap-10">
        {universes.map((u) => (
          <section key={u.id}>
            <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              {u.name}
            </h2>
            <div className="flex flex-col gap-4">
              {u.categories.map((c) => (
                <CategoryPricingCard key={c.id} category={c} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
