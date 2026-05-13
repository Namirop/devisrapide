import Link from "next/link";
import { Briefcase } from "lucide-react";

type Props = {
  categories: Array<{ id: string; name: string }>;
};

/**
 * Widget "Categories que vous recevez". Affiche les ProCategory du pro en
 * pills + un lien vers le profil pour les editer.
 */
export function CategoriesWidget({ categories }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Briefcase
            className="h-4 w-4 text-[#1e3a8a]"
            strokeWidth={2}
            aria-hidden
          />
          <h3 className="text-[14.5px] font-bold text-slate-900">
            Métiers couverts
          </h3>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
          {categories.length} actif{categories.length > 1 ? "s" : ""}
        </span>
      </div>

      {categories.length === 0 ? (
        <p className="text-[12.5px] text-slate-500">
          Vous n&apos;êtes inscrit à aucune catégorie. Ajoutez vos métiers
          pour recevoir des leads.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <li
              key={c.id}
              className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-[12.5px] font-medium text-[#1e3a8a]"
            >
              {c.name}
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/dashboard/profil"
        className="mt-3 inline-block text-[12.5px] font-medium text-[#1e3a8a] hover:underline"
      >
        Gérer mes catégories →
      </Link>
    </div>
  );
}
