import { createModuleLayoutGuard } from "@/lib/auth/layout-guard";

export default async function SettingsModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await createModuleLayoutGuard("settings.view");
  return children;
}
