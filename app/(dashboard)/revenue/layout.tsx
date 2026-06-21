import { createModuleLayoutGuard } from "@/lib/auth/layout-guard";

export default async function RevenueModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await createModuleLayoutGuard("dashboard.view");
  return children;
}
