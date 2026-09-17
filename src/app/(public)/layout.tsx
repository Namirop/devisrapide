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
      {/* flex-col + flex-1 : une page qui propage `flex-1` (ex. /demande)
          occupe toute la hauteur entre Header et Footer ; les autres
          gardent leur hauteur naturelle (sticky footer). */}
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </>
  );
}
