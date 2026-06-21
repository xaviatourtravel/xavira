import { createModuleLayoutGuard } from "@/lib/auth/layout-guard";

export default async function InboxModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await createModuleLayoutGuard("inbox.view");
  return children;
}
