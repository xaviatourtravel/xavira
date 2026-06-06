import Link from "next/link";

import type { ActiveLeadFilterBadge } from "@/lib/leads/list-filters";
import { cn } from "@/lib/utils";

type LeadsActiveFiltersProps = {
  badges: ActiveLeadFilterBadge[];
};

export function LeadsActiveFilters({ badges }: LeadsActiveFiltersProps) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Active filters:</span>

      {badges.map((badge) => (
        <Link
          key={`${badge.key}-${badge.label}`}
          href={badge.href}
          className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium hover:bg-muted"
          title="Remove filter"
        >
          {badge.label}
          <span aria-hidden="true" className="text-muted-foreground">
            ×
          </span>
        </Link>
      ))}

      <Link
        href="/leads"
        className={cn(
          "rounded-md border px-3 py-1 text-xs text-muted-foreground hover:text-foreground",
        )}
      >
        Clear filters
      </Link>
    </div>
  );
}
