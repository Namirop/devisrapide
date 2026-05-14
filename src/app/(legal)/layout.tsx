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
      <main className="relative flex-1 bg-slate-50">
        <div
          className="pointer-events-none absolute inset-0 bg-grid-pattern bg-fixed"
          aria-hidden
        />
        <div className="relative">{children}</div>
      </main>
      <Footer />
    </>
  );
}
