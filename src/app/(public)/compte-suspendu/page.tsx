export default function CompteSuspenduPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Compte suspendu</h1>
      <p className="mt-4 text-muted-foreground">
        L&apos;accès à votre espace pro est temporairement désactivé. Pour
        toute question, contactez{" "}
        <a
          href="mailto:contact@devisrapide.fr"
          className="font-medium underline"
        >
          contact@devisrapide.fr
        </a>
        .
      </p>
    </div>
  );
}
