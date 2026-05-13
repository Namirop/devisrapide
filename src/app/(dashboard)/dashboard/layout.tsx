// Placeholder layout pour la migration de route (commit 1). La Sidebar + TopBar
// arrivent dans les commits suivants (5, 6, 7).
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
