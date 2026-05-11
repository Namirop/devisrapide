import Link from "next/link";

export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        DevisRapide — refonte en cours
      </h1>
      <p className="text-base text-muted-foreground">
        L&apos;intégration de la nouvelle landing (design source v3) est
        en cours. Les sections seront ajoutées commit par commit.
      </p>
      <Link
        href="/demande"
        className="inline-flex h-11 items-center justify-center rounded-md bg-[#ea580c] px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#c2410c]"
      >
        Demander un devis
      </Link>
    </section>
  );
}
