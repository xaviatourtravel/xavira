import { buildMockAICopilotData } from "@/components/omnichannel-inbox/ai-copilot/mock-ai-copilot";
import { buildMockTimelineEvents } from "@/components/omnichannel-inbox/customer-timeline/mock-timeline-events";
import {
  mapBookingSnapshotFromConversation,
  isBookingSnapshotEmpty,
} from "@/lib/domain/mappers/booking";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";

import type {
  CustomerSnapshotConversationSeed,
  CustomerSnapshotData,
  CustomerSnapshotLabels,
} from "./types";

const RECENT_ACTIVITY_LIMIT = 5;
const AI_INSIGHT_BULLET_LIMIT = 3;

function formatJoinedDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildJourneyStages(labels: CustomerSnapshotLabels) {
  return [
    { id: "inquiry", label: labels.journeyStageInquiry, state: "completed" as const },
    { id: "qualifying", label: labels.journeyStageQualifying, state: "completed" as const },
    { id: "qualified", label: labels.journeyStageQualified, state: "current" as const },
    { id: "booking", label: labels.journeyStageBooking, state: "pending" as const },
  ];
}

function buildAiInsightBullets(conversationId: string): string[] {
  const copilot = buildMockAICopilotData(conversationId);
  const fromSignals = copilot.signals.slice(0, 2).map((signal) => signal.label);
  const summaryLine = copilot.summary?.split(".")[0]?.trim();

  const bullets = [
    ...fromSignals,
    summaryLine ? `${summaryLine}.` : null,
    `Closing window: ${copilot.estimatedClosing}.`,
  ].filter((value): value is string => Boolean(value));

  return bullets.slice(0, AI_INSIGHT_BULLET_LIMIT);
}

export function buildMockCustomerSnapshot(
  seed: CustomerSnapshotConversationSeed,
  labels: CustomerSnapshotLabels,
  conversation?: OmnichannelConversationDetail,
): CustomerSnapshotData {
  const statusLabel = seed.statusLabel?.trim() || "Qualified Lead";
  const booking = conversation
    ? mapBookingSnapshotFromConversation(conversation)
    : {
        status: "No Booking Yet",
        departure: "May 2026",
        destination: "Yunnan, China",
        travelers: "2",
        budget: "Under Rp20M",
      };

  const normalizedBooking = isBookingSnapshotEmpty(booking)
    ? {
        status: labels.noBookingYet,
        departure: "—",
        destination: "—",
        travelers: "—",
        budget: "—",
      }
    : booking;

  const timelineEvents = buildMockTimelineEvents(seed.id);

  return {
    header: {
      id: seed.id,
      name: seed.displayName,
      avatarUrl: seed.avatarUrl,
      channel: seed.channel,
      channelLabel: seed.channelLabel,
      statusLabel,
      joinedSince: formatJoinedDate(seed.createdAt),
      leadBadge: {
        label: "Hot",
        value: 82,
      },
    },
    journey: buildJourneyStages(labels),
    booking: normalizedBooking,
    aiInsight: {
      bullets: buildAiInsightBullets(seed.id),
    },
    recentActivity: timelineEvents.slice(0, RECENT_ACTIVITY_LIMIT).map((event) => ({
      id: event.id,
      title: event.title,
      timestamp: event.timestamp,
    })),
  };
}
