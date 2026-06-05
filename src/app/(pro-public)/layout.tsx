import { Header } from "@/components/ds/Header";
import { Footer } from "@/components/ds/Footer";

// Layout du route group (pro-public) — pages publiques orientees artisan.
// Header en variant "pro" (nav + CTAs artisan) + Footer DS. Le route group
// existe pour monter le Header pro sans heriter du layout (public) qui monte
// le Header client par defaut.

export default function ProPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header variant="pro" />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </>
  );
}
