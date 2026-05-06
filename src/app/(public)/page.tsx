import Link from "next/link";

export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Trouvez un artisan qualifié près de chez vous
      </h1>
      <p className="text-lg text-muted-foreground">
        Décrivez votre projet, on vous met en relation avec des
        professionnels disponibles dans votre secteur.
      </p>
      <Link
        href="/demande"
        className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-base font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        Demander un devis gratuit
      </Link>
    </section>
  );
}
