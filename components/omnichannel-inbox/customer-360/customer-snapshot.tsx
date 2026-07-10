"use client";

import { useMemo } from "react";
import { User } from "lucide-react";

import { getConversationDisplayName } from "@/components/omnichannel-inbox/inbox-display";
import {
  AURORA_SNAPSHOT_CARD,
  AURORA_SNAPSHOT_DIVIDER,
  AURORA_SNAPSHOT_SECTION_GAP,
  AURORA_WORKSPACE_COLUMN_HEADER,
} from "@/components/workspace/aurora-tokens";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { cn } from "@/lib/utils";

import { CustomerSnapshotAiInsightSection } from "./customer-snapshot-ai-insight";
import { CustomerSnapshotBooking } from "./customer-snapshot-booking";
import { CustomerSnapshotHeaderSection } from "./customer-snapshot-header";
import { CustomerSnapshotJourney } from "./customer-snapshot-journey";
import { CustomerSnapshotRecentActivity } from "./customer-snapshot-recent-activity";
import { buildMockCustomerSnapshot } from "./mock-customer-snapshot";
import type { CustomerSnapshotLabels } from "./types";

const SECTION_ICON_CLASS = "h-3.5 w-3.5 shrink-0 text-muted-foreground/55";
const SECTION_TITLE_CLASS = "text-[13px] font-semibold tracking-tight text-foreground";

type CustomerSnapshotProps = {
  conversation: OmnichannelConversationDetail;
  className?: string;
};

export function CustomerSnapshot({ conversation, className }: CustomerSnapshotProps) {
  const { ti } = useInboxTranslation();

  const labels = useMemo<CustomerSnapshotLabels>(
    () => ({
      title: ti("customerSnapshot"),
      joinedSince: ti("customer360JoinedSince"),
      journey: ti("contextPanelJourney"),
      bookingSummary: ti("customerSnapshotBookingSummary"),
      destination: ti("fieldDestination"),
      travelers: ti("customerSnapshotTravelers"),
      departure: ti("fieldDeparture"),
      budget: ti("fieldBudget"),
      noBookingYet: ti("emptyBookingStatus"),
      aiInsight: ti("customerSnapshotAiInsight"),
      openCopilot: ti("customerSnapshotOpenCopilot"),
      recentActivity: ti("customerSnapshotRecentActivity"),
      viewFullTimeline: ti("customerSnapshotViewFullTimeline"),
      journeyStageInquiry: ti("customerSnapshotJourneyInquiry"),
      journeyStageQualifying: ti("customerSnapshotJourneyQualifying"),
      journeyStageQualified: ti("customerSnapshotJourneyQualified"),
      journeyStageBooking: ti("customerSnapshotJourneyBooking"),
    }),
    [ti],
  );

  const snapshot = useMemo(
    () =>
      buildMockCustomerSnapshot(
        {
          id: conversation.id,
          displayName: getConversationDisplayName(conversation),
          avatarUrl: conversation.customerAvatar,
          channel: conversation.channel,
          channelLabel: conversation.channelLabel,
          statusLabel: conversation.statusLabel,
          createdAt: conversation.createdAt,
        },
        labels,
        conversation,
      ),
    [conversation, labels],
  );

  return (
    <section
      aria-labelledby="customer-snapshot-heading"
      className={cn(AURORA_SNAPSHOT_CARD, "rounded-none border-0 p-0", className)}
    >
      <div className={cn(AURORA_WORKSPACE_COLUMN_HEADER, "gap-2 px-3")}>
        <User className={SECTION_ICON_CLASS} aria-hidden strokeWidth={1.75} />
        <h3 id="customer-snapshot-heading" className={SECTION_TITLE_CLASS}>
          {labels.title}
        </h3>
      </div>

      <div className={cn(AURORA_SNAPSHOT_SECTION_GAP, "p-4 pt-3")}>
        <CustomerSnapshotHeaderSection header={snapshot.header} labels={labels} />

        <div className={AURORA_SNAPSHOT_DIVIDER} />

        <CustomerSnapshotJourney stages={snapshot.journey} labels={labels} />

        <div className={AURORA_SNAPSHOT_DIVIDER} />

        <CustomerSnapshotBooking booking={snapshot.booking} labels={labels} />

        <div className={AURORA_SNAPSHOT_DIVIDER} />

        <CustomerSnapshotAiInsightSection insight={snapshot.aiInsight} labels={labels} />

        <div className={AURORA_SNAPSHOT_DIVIDER} />

        <CustomerSnapshotRecentActivity events={snapshot.recentActivity} labels={labels} />
      </div>
    </section>
  );
}
