import Link from "next/link";

import {
  buildFollowUpCenterHref,
  FOLLOW_UP_CENTER_FILTER_LABELS,
  FOLLOW_UP_CENTER_FILTERS,
  type FollowUpCenterFilter,
} from "@/lib/follow-ups/list-filters";
import { cn } from "@/lib/utils";

type FollowUpsFiltersProps = {
  activeFilter: FollowUpCenterFilter;
};

export function FollowUpsFilters({ activeFilter }: FollowUpsFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FOLLOW_UP_CENTER_FILTERS.map((filter) => {
        const isActive = filter === activeFilter;

        return (
          <Link
            key={filter}
            href={buildFollowUpCenterHref(filter)}
            className={cn(
              "rounded-md border px-3 py-2 text-sm transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {FOLLOW_UP_CENTER_FILTER_LABELS[filter]}
          </Link>
        );
      })}
    </div>
  );
}
