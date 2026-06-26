import { createModuleLayoutGuard } from "@/lib/auth/layout-guard";

export default async function TodayModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await createModuleLayoutGuard("today.view");
  return children;
}
