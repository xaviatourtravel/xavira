"use client";

import { useMemo } from "react";

import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";

import { AICopilotPanel } from "./ai-copilot-panel";
import { buildMockAICopilotData } from "./mock-ai-copilot";
import type { AICopilotData, AICopilotLabels } from "./types";

type AICopilotSectionProps = {
  conversationId: string;
  data?: AICopilotData;
  className?: string;
};

export function AICopilotSection({
  conversationId,
  data,
  className,
}: AICopilotSectionProps) {
  const { ti } = useInboxTranslation();

  const copilotData = useMemo(
    () => data ?? buildMockAICopilotData(conversationId),
    [conversationId, data],
  );

  const labels = useMemo<AICopilotLabels>(
    () => ({
      title: ti("copilotTitle"),
      helper: ti("copilotContextHelper"),
      insightTitle: ti("copilotInsightTitle"),
      customerIntent: ti("copilotCustomerIntent"),
      confidence: ti("copilotConfidence"),
      leadTemperature: ti("copilotLeadTemperature"),
      estimatedClosing: ti("copilotEstimatedClosing"),
      nextActionTitle: ti("copilotNextActionTitle"),
      suggestedReplyTitle: ti("suggestedReply"),
      copy: ti("copy"),
      edit: ti("copilotEdit"),
      regenerate: ti("regenerate"),
      signalsTitle: ti("copilotSignalsTitle"),
      memoryTitle: ti("copilotMemoryTitle"),
      recommended: ti("copilotRecommended"),
    }),
    [ti],
  );

  return <AICopilotPanel data={copilotData} labels={labels} className={className} />;
}
