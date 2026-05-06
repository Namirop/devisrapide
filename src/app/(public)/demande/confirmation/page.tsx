import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Demande envoyée — DevisRapide",
  robots: { index: false, follow: false },
};

export default function ConfirmationPage() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        Votre demande a bien été reçue
      </h1>
      <p className="text-muted-foreground">
        Nous recherchons les artisans les mieux placés dans votre secteur.
        Vous recevrez très prochainement un email récapitulatif et serez
        recontacté(e) par téléphone dès qu&apos;un pro accepte votre demande.
      </p>
      <Link
        href="/"
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Retour à l&apos;accueil
      </Link>
    </section>
  );
}
