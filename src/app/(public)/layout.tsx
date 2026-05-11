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
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
