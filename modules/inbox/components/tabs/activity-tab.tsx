"use client";

import { useMemo } from "react";

import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import {
  InspectorEmpty,
  InspectorRoot,
  InspectorSection,
} from "@/components/ui/inspector";
import { formatInboxMessageTime } from "@/components/omnichannel-inbox/inbox-display";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { buildCopilotTimeline } from "@/modules/inbox/lib/build-ai-copilot";
import { cn } from "@/lib/utils";

type ActivityTabProps = {
  conversation: OmnichannelConversationDetail;
};

type TimelineItem = {
  id: string;
  label: string;
  detail?: string;
  timestamp: string;
};

type TimelineGroupKey = "today" | "yesterday" | "older";

function getTimelineGroup(timestamp: string): TimelineGroupKey {
  const date = new Date(timestamp);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) return "today";
  if (date >= startOfYesterday) return "yesterday";
  return "older";
}

function buildAllTimelineEvents(
  conversation: OmnichannelConversationDetail,
  ti: (key: InboxKey) => string,
): TimelineItem[] {
  const aiEvents = buildCopilotTimeline(conversation.aiActivityEvents).map((event) => ({
    id: event.id,
    label: ti(event.labelKey),
    detail: event.detail ?? undefined,
    timestamp: event.timestamp,
  }));

  const messageEvents: TimelineItem[] = conversation.messages.map((message) => ({
    id: `message-${message.id}`,
    label: ti(
      message.direction === "incoming" ? "activityCustomerMessage" : "activityTeamReply",
    ),
    detail: message.message_text?.trim() || undefined,
    timestamp: message.created_at,
  }));

  const noteEvents: TimelineItem[] = conversation.notes.map((note) => ({
    id: `note-${note.id}`,
    label: ti("activityInternalNote"),
    detail: note.note.trim(),
    timestamp: note.created_at,
  }));

  const crmEvents: TimelineItem[] = (conversation.leadContext?.timeline ?? []).map(
    (event) => ({
      id: event.id,
      label: event.label,
      detail: event.detail,
      timestamp: event.timestamp,
    }),
  );

  const systemEvents: TimelineItem[] = [
    {
      id: `conversation-created-${conversation.id}`,
      label: ti("activityConversationCreated"),
      detail: conversation.channelLabel,
      timestamp: conversation.createdAt,
    },
    ...conversation.assignmentHistory.map((entry) => ({
      id: `assignment-${entry.id}`,
      label: ti("activityAssignmentUpdated"),
      detail: entry.assignedToName
        ? entry.assignedByName
          ? `${entry.assignedToName} · ${entry.assignedByName}`
          : entry.assignedToName
        : entry.assignedByName ?? undefined,
      timestamp: entry.createdAt,
    })),
  ];

  return [...aiEvents, ...messageEvents, ...noteEvents, ...crmEvents, ...systemEvents].sort(
    (left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp),
  );
}

const GROUP_LABEL_KEYS: Record<TimelineGroupKey, InboxKey> = {
  today: "historyToday",
  yesterday: "historyYesterday",
  older: "historyOlder",
};

export function ActivityTab({ conversation }: ActivityTabProps) {
  const { ti } = useInboxTranslation();

  const groupedEvents = useMemo(() => {
    const allEvents = buildAllTimelineEvents(conversation, ti);
    const groups: Record<TimelineGroupKey, TimelineItem[]> = {
      today: [],
      yesterday: [],
      older: [],
    };

    for (const event of allEvents) {
      groups[getTimelineGroup(event.timestamp)].push(event);
    }

    return (["today", "yesterday", "older"] as const)
      .filter((key) => groups[key].length > 0)
      .map((key) => ({ key, labelKey: GROUP_LABEL_KEYS[key], items: groups[key] }));
  }, [conversation, ti]);

  return (
    <InspectorRoot className="pb-8">
      {groupedEvents.length > 0 ? (
        groupedEvents.map((group, index) => (
          <InspectorSection
            key={group.key}
            title={ti(group.labelKey)}
            hideDivider={index === groupedEvents.length - 1}
          >
            <ol className="relative space-y-0 border-l border-border/40 pl-4">
              {group.items.map((event, index) => (
                <li
                  key={event.id}
                  className={cn("relative pb-4 last:pb-0", index === 0 && "-mt-0.5")}
                >
                  <span
                    className="absolute -left-[calc(1rem+3px)] top-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
                    aria-hidden
                  />
                  <time className="text-[10px] tabular-nums text-muted-foreground">
                    {formatInboxMessageTime(event.timestamp)}
                  </time>
                  <p className="mt-0.5 text-[13px] text-foreground">{event.label}</p>
                  {event.detail ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {event.detail}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </InspectorSection>
        ))
      ) : (
        <div className="px-5 py-8">
          <InspectorEmpty title={ti("historyEmpty")} description={ti("historyEmpty")} />
        </div>
      )}
    </InspectorRoot>
  );
}
