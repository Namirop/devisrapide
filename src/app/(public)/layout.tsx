// Layout (public) temporairement minimaliste pendant la réintégration V3.
// Header + Footer seront ajoutés aux commits 6 et 11 (avec preload LCP).
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="flex-1">{children}</main>;
}
