"use client";

import { useMemo } from "react";
import { Bot, History, MessageSquare, Settings2, Users } from "lucide-react";

import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import {
  InspectorEmpty,
  InspectorHeader,
  InspectorListItem,
  InspectorRoot,
  InspectorSection,
} from "@/components/ui/inspector";
import { formatInboxMessageTime } from "@/components/omnichannel-inbox/inbox-display";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { buildCopilotTimeline } from "@/modules/inbox/lib/build-ai-copilot";

type ActivityTabProps = {
  conversation: OmnichannelConversationDetail;
};

type ConversationActivityItem = {
  id: string;
  labelKey: InboxKey;
  detail?: string;
  timestamp: string;
};

type CrmActivityItem = {
  id: string;
  labelKey: InboxKey;
  labelFallback?: string;
  detail?: string;
  timestamp: string;
};

type SystemActivityItem = {
  id: string;
  labelKey: InboxKey;
  detail?: string;
  timestamp: string;
};

function buildConversationEvents(
  conversation: OmnichannelConversationDetail,
): ConversationActivityItem[] {
  const messageItems: ConversationActivityItem[] = conversation.messages.map((message) => ({
    id: `message-${message.id}`,
    labelKey:
      message.direction === "incoming" ? "activityCustomerMessage" : "activityTeamReply",
    detail: message.message_text?.trim() || undefined,
    timestamp: message.created_at,
  }));

  const noteItems: ConversationActivityItem[] = conversation.notes.map((note) => ({
    id: `note-${note.id}`,
    labelKey: "activityInternalNote",
    detail: note.note.trim(),
    timestamp: note.created_at,
  }));

  return [...messageItems, ...noteItems]
    .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))
    .slice(0, 12);
}

function buildCrmTimelineEvents(
  conversation: OmnichannelConversationDetail,
): CrmActivityItem[] {
  return (conversation.leadContext?.timeline ?? [])
    .map((event) => ({
      id: event.id,
      labelKey: "activityCrmTimelineEvent" as InboxKey,
      labelFallback: event.label,
      detail: event.detail,
      timestamp: event.timestamp,
    }))
    .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))
    .slice(0, 12);
}

function buildSystemEvents(
  conversation: OmnichannelConversationDetail,
): SystemActivityItem[] {
  const items: SystemActivityItem[] = [
    {
      id: `conversation-created-${conversation.id}`,
      labelKey: "activityConversationCreated",
      detail: conversation.channelLabel,
      timestamp: conversation.createdAt,
    },
  ];

  for (const entry of conversation.assignmentHistory) {
    items.push({
      id: `assignment-${entry.id}`,
      labelKey: "activityAssignmentUpdated",
      detail: entry.assignedToName
        ? entry.assignedByName
          ? `${entry.assignedToName} · ${entry.assignedByName}`
          : entry.assignedToName
        : entry.assignedByName ?? undefined,
      timestamp: entry.createdAt,
    });
  }

  return items
    .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))
    .slice(0, 12);
}

export function ActivityTab({ conversation }: ActivityTabProps) {
  const { ti } = useInboxTranslation();

  const aiEvents = useMemo(
    () => buildCopilotTimeline(conversation.aiActivityEvents),
    [conversation.aiActivityEvents],
  );
  const conversationEvents = useMemo(
    () => buildConversationEvents(conversation),
    [conversation],
  );
  const crmEvents = useMemo(() => buildCrmTimelineEvents(conversation), [conversation]);
  const systemEvents = useMemo(() => buildSystemEvents(conversation), [conversation]);

  return (
    <InspectorRoot className="pb-8">
      <InspectorHeader
        icon={History}
        title={ti("workspacePanelActivityTitle")}
        description={ti("workspacePanelActivityDesc")}
      />

      <InspectorSection icon={Bot} title={ti("activityAiEvents")} collapsible defaultOpen>
        {aiEvents.length > 0 ? (
          <ActivityList
            items={aiEvents.map((event) => ({
              id: event.id,
              label: ti(event.labelKey),
              detail: event.detail ?? undefined,
              timestamp: event.timestamp,
            }))}
          />
        ) : (
          <InspectorEmpty title={ti("timelineEmpty")} description={ti("timelineEmpty")} />
        )}
      </InspectorSection>

      <InspectorSection icon={MessageSquare} title={ti("activityConversationTimeline")} collapsible>
        {conversationEvents.length > 0 ? (
          <ActivityList
            items={conversationEvents.map((event) => ({
              id: event.id,
              label: ti(event.labelKey),
              detail: event.detail,
              timestamp: event.timestamp,
            }))}
          />
        ) : (
          <InspectorEmpty
            title={ti("activityNoConversationEvents")}
            description={ti("activityNoConversationEvents")}
          />
        )}
      </InspectorSection>

      <InspectorSection icon={Users} title={ti("activityCrmTimeline")} collapsible>
        {crmEvents.length > 0 ? (
          <ActivityList
            items={crmEvents.map((event) => ({
              id: event.id,
              label: event.labelFallback ?? ti(event.labelKey),
              detail: event.detail,
              timestamp: event.timestamp,
            }))}
          />
        ) : (
          <InspectorEmpty
            title={ti("customer360NoCrmEvents")}
            description={ti("customer360NoCrmEvents")}
          />
        )}
      </InspectorSection>

      <InspectorSection
        icon={Settings2}
        title={ti("activitySystemEvents")}
        collapsible
        hideDivider
      >
        {systemEvents.length > 0 ? (
          <ActivityList
            items={systemEvents.map((event) => ({
              id: event.id,
              label: ti(event.labelKey),
              detail: event.detail,
              timestamp: event.timestamp,
            }))}
          />
        ) : (
          <InspectorEmpty
            title={ti("activityNoSystemEvents")}
            description={ti("activityNoSystemEvents")}
          />
        )}
      </InspectorSection>
    </InspectorRoot>
  );
}

function ActivityList({
  items,
}: {
  items: Array<{ id: string; label: string; detail?: string; timestamp: string }>;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map((event) => (
        <InspectorListItem
          key={event.id}
          label={event.label}
          detail={event.detail}
          meta={formatInboxMessageTime(event.timestamp)}
        />
      ))}
    </ul>
  );
}
