/**
 * @deprecated Use generateIntelligenceSnapshotSync from @/lib/intelligence
 */
import { generateIntelligenceSnapshotSync } from "@/lib/intelligence/engine/pipeline-engine";
import type { WorkspaceConversationViewModel } from "@/lib/communication-workspace/types";
import type {
  WorkspaceIntelligencePlaceholder,
  WorkspaceIntelligenceState,
} from "@/lib/communication-workspace/types";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";

export const EMPTY_INTELLIGENCE: WorkspaceIntelligencePlaceholder = {
  state: "pending",
  summary: null,
  extractedFields: {
    name: "",
    destination: "",
    departure: "",
    pax: "",
    budget: "",
    city: "",
  },
  leadScore: null,
  leadScoreLabel: null,
  revenuePotentialIdr: null,
  nextBestAction: null,
  suggestedReply: null,
};

/** @deprecated Use Intelligence Engine snapshot pipeline */
export function buildPlaceholderIntelligence(
  vm: WorkspaceConversationViewModel,
  conversation?: OmnichannelConversationDetail,
  organizationId = "local",
): WorkspaceIntelligencePlaceholder {
  if (!conversation) {
    return EMPTY_INTELLIGENCE;
  }

  const snapshot = generateIntelligenceSnapshotSync({
    conversation,
    organizationId,
  });

  if (snapshot.state === "pending") {
    return EMPTY_INTELLIGENCE;
  }

  const reply = snapshot.recommendation.items.find(
    (item) => item.action === "suggested_reply",
  );
  const followUp = snapshot.recommendation.items.find(
    (item) => item.action === "follow_up",
  );

  const extractedFields = {
    name: snapshot.entities.fields.find((f) => f.field === "name")?.value ?? vm.displayName,
    destination:
      snapshot.entities.fields.find((f) => f.field === "destination")?.value ?? "",
    departure:
      snapshot.entities.fields.find((f) => f.field === "departure")?.value ?? "",
    pax: snapshot.entities.fields.find((f) => f.field === "pax")?.value ?? "",
    budget: snapshot.entities.fields.find((f) => f.field === "budget")?.value ?? "",
    city: snapshot.entities.fields.find((f) => f.field === "city")?.value ?? "",
  };

  return {
    state: "preview",
    summary: snapshot.summary,
    extractedFields,
    leadScore: snapshot.scores.leadScore,
    leadScoreLabel: snapshot.scores.leadScoreLabel,
    revenuePotentialIdr: snapshot.scores.revenuePotentialIdr,
    nextBestAction: followUp?.content ?? null,
    suggestedReply: reply?.content ?? null,
  };
}

export function resolveIntelligenceState(
  placeholder: WorkspaceIntelligencePlaceholder,
): WorkspaceIntelligenceState {
  return placeholder.state;
}
