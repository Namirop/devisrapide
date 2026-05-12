import { Header } from "@/components/ds/Header";
import { Footer } from "@/components/ds/Footer";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">{children}</main>
      <Footer />
    </>
  );
}
