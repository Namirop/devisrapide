import { cn } from "@/lib/utils";

// Wrapper typographique sobre pour les pages legales. Le contenu est compose
// directement en JSX (h1/h2/h3/p/ul) — pas de markdown / MDX au MVP.
// `prose`-like en local pour eviter d'ajouter @tailwindcss/typography.

type Props = {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
  className?: string;
};

export function LegalContent({ title, updatedAt, children, className }: Props) {
  return (
    <article
      className={cn(
        "mx-auto max-w-[760px] px-4 py-14 sm:px-6 lg:py-20",
        // Styles "prose" maison : h1/h2/h3, p, ul, a, strong, etc.
        "[&_h1]:font-display [&_h1]:mb-2 [&_h1]:text-[34px] [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-slate-900 lg:[&_h1]:text-[40px]",
        "[&_h2]:font-display [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-[20px] [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-slate-900",
        "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:text-slate-900",
        "[&_p]:mb-3 [&_p]:text-[14.5px] [&_p]:leading-relaxed [&_p]:text-slate-600",
        "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul>li]:mb-1.5 [&_ul>li]:text-[14.5px] [&_ul>li]:leading-relaxed [&_ul>li]:text-slate-600",
        "[&_strong]:font-semibold [&_strong]:text-slate-900",
        "[&_a]:font-medium [&_a]:text-[#1e3a8a] [&_a]:underline-offset-2 hover:[&_a]:underline",
        className,
      )}
    >
      <header className="mb-10 border-b border-slate-200 pb-6">
        <h1>{title}</h1>
        <p className="text-[12.5px] text-slate-500">
          Dernière mise à jour : {updatedAt}
        </p>
      </header>
      {children}
    </article>
  );
}
