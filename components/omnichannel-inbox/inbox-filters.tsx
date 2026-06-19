"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { OmnichannelFilterCounts } from "@/components/omnichannel-inbox/inbox-display";
import type { OmnichannelInboxFilter } from "@/lib/omnichannel-inbox/queries";
import { cn } from "@/lib/utils";

const FILTERS: Array<{ value: OmnichannelInboxFilter; label: string }> = [
  { value: "all", label: "All Conversations" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "unassigned", label: "Unassigned" },
  { value: "mine", label: "My Conversations" },
  { value: "hot_leads", label: "Hot Leads" },
];

function buildInboxHref(filter: OmnichannelInboxFilter, conversationId?: string | null) {
  const params = new URLSearchParams();
  if (filter !== "all") {
    params.set("filter", filter);
  }
  if (conversationId) {
    params.set("c", conversationId);
  }
  const query = params.toString();
  return query ? `/inbox?${query}` : "/inbox";
}

export function OmnichannelInboxFilters({
  activeFilter,
  selectedConversationId,
  filterCounts,
}: {
  activeFilter: OmnichannelInboxFilter;
  selectedConversationId: string | null;
  filterCounts: OmnichannelFilterCounts;
}) {
  const searchParams = useSearchParams();
  const currentConversationId = searchParams.get("c") ?? selectedConversationId;

  return (
    <nav className="space-y-2">
      <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Inbox Filters
      </p>
      <div className="space-y-1">
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.value;
          const count = filterCounts[filter.value];

          return (
            <Link
              key={filter.value}
              href={buildInboxHref(filter.value, currentConversationId)}
              className={cn(
                "flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "border-primary/20 bg-primary text-primary-foreground shadow-sm"
                  : "border-transparent bg-muted/40 text-foreground hover:border-border hover:bg-muted",
              )}
            >
              <span>{filter.label}</span>
              <span
                className={cn(
                  "inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background text-muted-foreground",
                )}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
