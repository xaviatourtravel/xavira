"use client";

import { useMemo } from "react";
import { History } from "lucide-react";

import { AURORA_CONTEXT_CARD_CLASS } from "@/components/workspace/aurora-tokens";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { cn } from "@/lib/utils";

import { CustomerTimelineFeed } from "./customer-timeline-feed";
import { buildMockTimelineEvents } from "./mock-timeline-events";

const SECTION_ICON_CLASS = "h-4 w-4 shrink-0 text-muted-foreground/55";
const SECTION_TITLE_CLASS = "text-[13px] font-semibold tracking-tight text-foreground";

type CustomerTimelineSectionProps = {
  conversationId: string;
  className?: string;
};

export function CustomerTimelineSection({
  conversationId,
  className,
}: CustomerTimelineSectionProps) {
  const { ti } = useInboxTranslation();

  const events = useMemo(
    () => buildMockTimelineEvents(conversationId),
    [conversationId],
  );

  const labels = useMemo(
    () => ({
      today: ti("customerTimelineGroupToday"),
      yesterday: ti("customerTimelineGroupYesterday"),
      lastWeek: ti("customerTimelineGroupLastWeek"),
    }),
    [ti],
  );

  return (
    <section className={cn(AURORA_CONTEXT_CARD_CLASS, className)}>
      <div className="mb-4 flex items-center gap-2">
        <History className={SECTION_ICON_CLASS} aria-hidden strokeWidth={1.75} />
        <h3 className={SECTION_TITLE_CLASS}>{ti("contextPanelTimeline")}</h3>
      </div>

      <CustomerTimelineFeed events={events} labels={labels} />
    </section>
  );
}
