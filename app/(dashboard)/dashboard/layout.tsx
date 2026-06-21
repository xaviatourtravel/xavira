import { createModuleLayoutGuard } from "@/lib/auth/layout-guard";

export default async function DashboardModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await createModuleLayoutGuard("dashboard.view");
  return children;
}
