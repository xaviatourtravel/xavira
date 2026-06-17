import Link from "next/link";

import {
  buildContentPlanningHref,
  type ContentPlanningFilters,
  type ContentView,
} from "@/lib/content/planning-view";
import { cn } from "@/lib/utils";

type ContentViewToggleProps = {
  filters: ContentPlanningFilters;
};

const VIEW_OPTIONS: ReadonlyArray<{ value: ContentView; label: string }> = [
  { value: "board", label: "Board" },
  { value: "list", label: "List" },
  { value: "calendar", label: "Calendar" },
];

export function ContentViewToggle({ filters }: ContentViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border bg-muted/30 p-1">
      {VIEW_OPTIONS.map((option) => {
        const isActive = filters.view === option.value;

        return (
          <Link
            key={option.value}
            href={buildContentPlanningHref(filters, { view: option.value })}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
