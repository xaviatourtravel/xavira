import { createModuleLayoutGuard } from "@/lib/auth/layout-guard";

export default async function FollowUpsModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await createModuleLayoutGuard("followups.view");
  return children;
}
