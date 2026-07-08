"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

import type { OmnichannelFilterCounts } from "@/components/omnichannel-inbox/inbox-display";
import {
  AURORA_MOTION,
  AURORA_QUEUE_FILTER_CHIP,
} from "@/components/workspace/aurora-tokens";
import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import type { OmnichannelInboxFilter } from "@/lib/omnichannel-inbox/queries";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { cn } from "@/lib/utils";

type FilterItem = { value: OmnichannelInboxFilter; labelKey: InboxKey };

const PRIMARY_FILTERS: FilterItem[] = [
  { value: "all", labelKey: "filterAll" },
  { value: "unread", labelKey: "filterUnread" },
  { value: "mine", labelKey: "filterMine" },
  { value: "ready_for_human", labelKey: "filterReadyForHuman" },
];

const SECONDARY_FILTERS: FilterItem[] = [
  { value: "whatsapp", labelKey: "filterWhatsapp" },
  { value: "ai_active", labelKey: "filterAiActive" },
  { value: "human_assisted", labelKey: "filterHumanAssisted" },
  { value: "human_only", labelKey: "filterHumanOnly" },
  { value: "instagram", labelKey: "filterInstagram" },
  { value: "facebook", labelKey: "filterFacebook" },
  { value: "unassigned", labelKey: "filterUnassigned" },
  { value: "hot_leads", labelKey: "filterHotLeads" },
];

const ALL_FILTERS: FilterItem[] = [...PRIMARY_FILTERS, ...SECONDARY_FILTERS];

const COUNTED_FILTERS = new Set<OmnichannelInboxFilter>([
  "unread",
  "ready_for_human",
]);

function shouldShowFilterCount(filter: OmnichannelInboxFilter) {
  return COUNTED_FILTERS.has(filter);
}

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

function isSecondaryFilter(filter: OmnichannelInboxFilter) {
  return SECONDARY_FILTERS.some((item) => item.value === filter);
}

function FilterChip({
  filter,
  isActive,
  count,
  href,
  onNavigate,
  showCount = false,
}: {
  filter: FilterItem;
  isActive: boolean;
  count: number;
  href: string;
  onNavigate?: () => void;
  showCount?: boolean;
}) {
  const { ti } = useInboxTranslation();
  const hasCount = showCount && count > 0;

  return (
    <Link
      href={href}
      role="tab"
      aria-selected={isActive}
      onClick={onNavigate}
      className={cn(
        AURORA_QUEUE_FILTER_CHIP,
        AURORA_MOTION.hover,
        isActive
          ? "bg-foreground/[0.07] text-foreground dark:bg-foreground/10"
          : "text-muted-foreground hover:bg-muted/35 hover:text-foreground",
      )}
    >
      <span>{ti(filter.labelKey)}</span>
      {hasCount ? (
        <span
          className={cn(
            "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums leading-none",
            isActive
              ? "bg-primary/15 text-primary"
              : "bg-muted/50 text-muted-foreground",
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

function MoreFiltersDropdown({
  activeFilter,
  currentConversationId,
  filterCounts,
}: {
  activeFilter: OmnichannelInboxFilter;
  currentConversationId: string | null;
  filterCounts: OmnichannelFilterCounts;
}) {
  const { ti } = useInboxTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const secondaryActive = isSecondaryFilter(activeFilter)
    ? SECONDARY_FILTERS.find((filter) => filter.value === activeFilter)
    : null;

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const triggerLabel = secondaryActive
    ? `${ti("filterMore")} · ${ti(secondaryActive.labelKey)}`
    : ti("filterMore");

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          AURORA_QUEUE_FILTER_CHIP,
          AURORA_MOTION.hover,
          "max-w-[9.5rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          secondaryActive
            ? "bg-foreground/[0.07] text-foreground dark:bg-foreground/10"
            : "text-muted-foreground hover:bg-muted/35 hover:text-foreground",
        )}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown
          className={cn("h-3 w-3 shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.35rem)] z-30 min-w-[11rem] overflow-hidden rounded-[14px] border border-border/25 bg-background/95 py-1 shadow-lg backdrop-blur-sm"
        >
          {SECONDARY_FILTERS.map((filter) => {
            const isActive = activeFilter === filter.value;
            const count = filterCounts[filter.value];
            return (
              <Link
                key={filter.value}
                role="menuitem"
                href={buildInboxHref(filter.value, currentConversationId)}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between gap-3 px-3 py-2 text-xs transition-colors hover:bg-muted/40",
                  isActive ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                <span>{ti(filter.labelKey)}</span>
                {shouldShowFilterCount(filter.value) && count > 0 ? (
                  <span className="tabular-nums text-muted-foreground/70">
                    {count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
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
  const visibleActiveFilter = ALL_FILTERS.some((filter) => filter.value === activeFilter)
    ? activeFilter
    : "all";

  return (
    <div
      className="-mx-1 flex items-center gap-1.5 px-1"
      role="tablist"
      aria-label={ti("filterAriaLabel")}
    >
      <div className="flex min-w-0 flex-1 flex-nowrap gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PRIMARY_FILTERS.map((filter) => (
          <FilterChip
            key={filter.value}
            filter={filter}
            isActive={visibleActiveFilter === filter.value}
            count={filterCounts[filter.value]}
            href={buildInboxHref(filter.value, currentConversationId)}
            showCount={shouldShowFilterCount(filter.value)}
          />
        ))}
      </div>

      <MoreFiltersDropdown
        activeFilter={visibleActiveFilter}
        currentConversationId={currentConversationId}
        filterCounts={filterCounts}
      />
    </div>
  );
}
