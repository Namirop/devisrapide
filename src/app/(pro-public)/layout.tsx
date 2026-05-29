import { HeaderPro } from "@/components/ds/HeaderPro";
import { Footer } from "@/components/ds/Footer";

// Layout du route group (pro-public) — pages publiques orientees artisan.
// HeaderPro (nav specifique) + Footer DS. Le route group existe pour ne
// pas heriter du layout (public) qui injecte le Header particulier.

export default function ProPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HeaderPro />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </>
  );
}
