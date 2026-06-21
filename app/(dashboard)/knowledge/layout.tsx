import { createModuleLayoutGuard } from "@/lib/auth/layout-guard";

export default async function KnowledgeModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await createModuleLayoutGuard("knowledge.view");
  return children;
}
