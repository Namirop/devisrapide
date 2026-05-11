import { NavPublic } from "@/components/ds/NavPublic";
import { Footer } from "@/components/ds/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavPublic />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
