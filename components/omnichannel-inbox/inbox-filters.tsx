"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { OmnichannelInboxFilter } from "@/lib/omnichannel-inbox/queries";
import { cn } from "@/lib/utils";

const FILTERS: Array<{ value: OmnichannelInboxFilter; label: string }> = [
  { value: "all", label: "All" },
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
}: {
  activeFilter: OmnichannelInboxFilter;
  selectedConversationId: string | null;
}) {
  const searchParams = useSearchParams();
  const currentConversationId = searchParams.get("c") ?? selectedConversationId;

  return (
    <nav className="space-y-1">
      <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Filters
      </p>
      {FILTERS.map((filter) => (
        <Link
          key={filter.value}
          href={buildInboxHref(filter.value, currentConversationId)}
          className={cn(
            "block rounded-lg px-3 py-2 text-sm transition-colors",
            activeFilter === filter.value
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-muted",
          )}
        >
          {filter.label}
        </Link>
      ))}
    </nav>
  );
}
