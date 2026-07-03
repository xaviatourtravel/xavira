"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { OmnichannelFilterCounts } from "@/components/omnichannel-inbox/inbox-display";
import type { OmnichannelInboxFilter } from "@/lib/omnichannel-inbox/queries";
import { cn } from "@/lib/utils";

const FILTERS: Array<{ value: OmnichannelInboxFilter; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "ready_for_human", label: "Ready for Human" },
  { value: "ai_active", label: "AI Active" },
  { value: "human_assisted", label: "Human Assisted" },
  { value: "human_only", label: "Human Only" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "unassigned", label: "Unassigned" },
  { value: "mine", label: "My Conversations" },
  { value: "hot_leads", label: "Following Up" },
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
  const visibleActiveFilter = FILTERS.some((filter) => filter.value === activeFilter)
    ? activeFilter
    : "all";

  return (
    <div
      className="-mx-4 flex flex-nowrap gap-2 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Conversation filters"
    >
      {FILTERS.map((filter) => {
        const isActive = visibleActiveFilter === filter.value;
        const count = filterCounts[filter.value];

        return (
          <Link
            key={filter.value}
            href={buildInboxHref(filter.value, currentConversationId)}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-foreground hover:bg-muted/80",
            )}
          >
            <span>{filter.label}</span>
            <span
              className={cn(
                "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
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
  );
}
