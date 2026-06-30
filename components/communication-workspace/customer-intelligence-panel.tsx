"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";

import { IntelligenceCardListLayout } from "@/components/communication-workspace/intelligence-cards/intelligence-card-list";
import {
  IntelligenceDivider,
  IntelligencePanel,
  IntelligencePanelBody,
  IntelligencePanelHeader,
} from "@/components/communication-workspace/primitives";
import { mapConversationToWorkspace } from "@/lib/communication-workspace/map-conversation";
import { generateIntelligenceSnapshotSync } from "@/lib/intelligence/engine/pipeline-engine";
import type { ExtractedEntityField } from "@/lib/intelligence/entities/types";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";

type CustomerIntelligencePanelProps = {
  conversation: OmnichannelConversationDetail | null;
  organizationId: string;
  embedded?: boolean;
};

function PanelEmptySelection() {
  return (
    <IntelligencePanel>
      <IntelligencePanelHeader subtitle="Reasoning layer · all channels" />
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-soft bg-card shadow-sm">
          <MessageSquare className="h-5 w-5 text-muted-foreground/50" />
        </div>
        <p className="mt-4 text-sm font-medium tracking-tight text-foreground">
          Select a conversation
        </p>
        <p className="mt-2 max-w-[240px] text-xs leading-relaxed text-muted-foreground">
          Intelligence snapshots power every card — memory, intent, emotion, and
          recommendations.
        </p>
      </div>
    </IntelligencePanel>
  );
}

function CustomerIntelligenceContent({
  conversation,
  organizationId,
  embedded = false,
}: {
  conversation: OmnichannelConversationDetail;
  organizationId: string;
  embedded?: boolean;
}) {
  const workspace = useMemo(
    () => mapConversationToWorkspace(conversation),
    [conversation],
  );

  const snapshot = useMemo(
    () =>
      generateIntelligenceSnapshotSync({
        conversation,
        organizationId,
      }),
    [conversation, organizationId],
  );

  const [editedFields, setEditedFields] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const field of snapshot.entities.fields) {
      if (field.value) {
        initial[field.field] = field.value;
      }
    }
    setEditedFields(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when conversation changes
  }, [snapshot.conversationId, snapshot.state]);

  function handleFieldChange(field: ExtractedEntityField, value: string) {
    setEditedFields((current) => ({ ...current, [field]: value }));
  }

  return (
    <IntelligencePanel className={embedded ? "border-0 shadow-none" : undefined}>
      {!embedded ? (
        <IntelligencePanelHeader subtitle="Powered by Intelligence Engine · preview" />
      ) : null}
      <IntelligencePanelBody className={embedded ? "pt-0" : undefined}>
        <IntelligenceDivider />

        <IntelligenceCardListLayout
          snapshot={snapshot}
          timeline={workspace.timeline}
          editedFields={editedFields}
          onFieldChange={handleFieldChange}
        />
      </IntelligencePanelBody>
    </IntelligencePanel>
  );
}

const CustomerIntelligenceContentMemo = memo(CustomerIntelligenceContent);

export function CustomerIntelligencePanel({
  conversation,
  organizationId,
  embedded = false,
}: CustomerIntelligencePanelProps) {
  if (!conversation) {
    return <PanelEmptySelection />;
  }

  return (
    <CustomerIntelligenceContentMemo
      conversation={conversation}
      organizationId={organizationId}
      embedded={embedded}
    />
  );
}
