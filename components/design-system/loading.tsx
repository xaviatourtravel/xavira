import {
  DesklabsCardSkeleton,
  DesklabsInlineLoading,
  DesklabsPageLoader,
  DesklabsSkeleton,
  DesklabsSpinner,
  DesklabsTableSkeleton,
  DesklabsWorkspaceSkeleton,
} from "@/components/ui/desklabs-loading";

export {
  DesklabsSpinner as DsSpinner,
  DesklabsSkeleton as DsSkeleton,
  DesklabsCardSkeleton as DsCardPlaceholder,
  DesklabsTableSkeleton as DsTableSkeleton,
  DesklabsWorkspaceSkeleton as DsWorkspaceSkeleton,
  DesklabsInlineLoading as DsInlineLoading,
  DesklabsPageLoader as DsPageLoader,
};

export function DsSkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <DesklabsSkeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <DesklabsSkeleton className="h-3 w-1/3" />
            <DesklabsSkeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
