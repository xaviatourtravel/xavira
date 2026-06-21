import { createModuleLayoutGuard } from "@/lib/auth/layout-guard";

export default async function PackagesModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await createModuleLayoutGuard("bookings.view");
  return children;
}
