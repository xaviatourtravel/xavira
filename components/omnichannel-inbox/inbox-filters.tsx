"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { OmnichannelFilterCounts } from "@/components/omnichannel-inbox/inbox-display";
import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import type { OmnichannelInboxFilter } from "@/lib/omnichannel-inbox/queries";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { cn } from "@/lib/utils";

const FILTERS: Array<{ value: OmnichannelInboxFilter; labelKey: InboxKey }> = [
  { value: "all", labelKey: "filterAll" },
  { value: "whatsapp", labelKey: "filterWhatsapp" },
  { value: "ready_for_human", labelKey: "filterReadyForHuman" },
  { value: "ai_active", labelKey: "filterAiActive" },
  { value: "human_assisted", labelKey: "filterHumanAssisted" },
  { value: "human_only", labelKey: "filterHumanOnly" },
  { value: "instagram", labelKey: "filterInstagram" },
  { value: "facebook", labelKey: "filterFacebook" },
  { value: "unassigned", labelKey: "filterUnassigned" },
  { value: "mine", labelKey: "filterMine" },
  { value: "hot_leads", labelKey: "filterHotLeads" },
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
  const { ti } = useInboxTranslation();
  const searchParams = useSearchParams();
  const currentConversationId = searchParams.get("c") ?? selectedConversationId;
  const visibleActiveFilter = FILTERS.some((filter) => filter.value === activeFilter)
    ? activeFilter
    : "all";

  return (
    <div
      className="-mx-4 flex flex-nowrap gap-1.5 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label={ti("filterAriaLabel")}
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
              "inline-flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2.5 text-[11px] font-medium transition-colors",
              isActive
                ? "bg-muted/70 text-foreground dark:bg-muted/40"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
          >
            <span>{ti(filter.labelKey)}</span>
            <span
              className={cn(
                "inline-flex min-w-4 items-center justify-center text-[10px] tabular-nums",
                isActive ? "text-muted-foreground" : "text-muted-foreground/70",
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
