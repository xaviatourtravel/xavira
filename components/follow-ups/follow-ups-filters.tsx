"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

import type { OrgProfileOption } from "@/lib/leads/assignment";
import {
  buildFollowUpCenterHref,
  FOLLOW_UP_CENTER_FILTER_LABELS,
  FOLLOW_UP_CENTER_FILTERS,
  type FollowUpCenterFilter,
} from "@/lib/follow-ups/list-filters";
import { cn } from "@/lib/utils";

type FollowUpsFiltersProps = {
  activeFilter: FollowUpCenterFilter;
  activeAssigned: string;
  profiles: OrgProfileOption[];
};

export function FollowUpsFilters({
  activeFilter,
  activeAssigned,
  profiles,
}: FollowUpsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const pushAssigned = useCallback(
    (assigned: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (assigned) {
        params.set("assigned", assigned);
      } else {
        params.delete("assigned");
      }

      const query = params.toString();

      startTransition(() => {
        router.replace(query ? `/follow-ups?${query}` : "/follow-ups");
      });
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex flex-wrap gap-2">
        {FOLLOW_UP_CENTER_FILTERS.map((filter) => {
          const isActive = filter === activeFilter;

          return (
            <Link
              key={filter}
              href={buildFollowUpCenterHref({
                filter,
                assigned: activeAssigned,
              })}
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

      <select
        value={activeAssigned}
        onChange={(event) => pushAssigned(event.target.value)}
        className="rounded-md border px-3 py-2 text-sm sm:ml-auto"
        aria-label="Assigned User filter"
      >
        <option value="">All Users</option>
        <option value="me">My Follow Ups</option>
        <option value="unassigned">Unassigned Leads</option>
        {profiles.map((member) => (
          <option key={member.id} value={member.id}>
            {member.full_name || "Pengguna"}
          </option>
        ))}
      </select>
    </div>
  );
}
