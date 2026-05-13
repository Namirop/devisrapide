import { Header } from "@/components/ds/Header";
import { Footer } from "@/components/ds/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/images/hero-artisan-800.webp"
        type="image/webp"
      />
      <Header />
      {/* Pas de flex-1 ici : on veut que le Footer suive immediatement le
          contenu de la page, sans zone vide entre les deux sur grand ecran.
          Sur pages tres courtes, le Footer ne sera donc pas colle en bas
          de viewport — assume au profit d'un layout coherent sur /demande. */}
      <main>{children}</main>
      <Footer />
    </>
  );
}
