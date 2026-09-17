import { Header } from "@/components/ds/Header";
import { Footer } from "@/components/ds/Footer";

// Pages publiques destinées aux artisans : route group distinct pour monter
// le Header « pro » sans hériter du Header client du groupe (public).

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
