import { createModuleLayoutGuard } from "@/lib/auth/layout-guard";

export default async function CampaignsModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await createModuleLayoutGuard("content.view");
  return children;
}
