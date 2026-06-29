import { DesklabsTableSkeleton, DesklabsWorkspaceSkeleton } from "@/components/ui/desklabs-loading";

export default function CustomersLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
      <DesklabsWorkspaceSkeleton message="Memuat data customer..." cards={0} className="max-w-none px-0 py-0" />
      <DesklabsTableSkeleton rows={8} columns={5} />
    </div>
  );
}
