import { createModuleLayoutGuard } from "@/lib/auth/layout-guard";

export default async function LeadsModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await createModuleLayoutGuard("leads.view");
  return children;
}
