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
      {/* main est flex-col + flex-1 : permet aux pages dont le wrapper est
          aussi flex-col + flex-1 (ex: /demande) de propager le `flex-1`
          jusqu'aux enfants pour exploiter la zone viewport entre Header et
          Footer. Pour les pages avec contenu naturel (legales, etc.), le
          comportement est inchange : main grossit a hauteur de son contenu
          ou remplit l'espace restant (sticky footer pattern classique). */}
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </>
  );
}
