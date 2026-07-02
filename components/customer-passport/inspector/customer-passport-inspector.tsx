"use client";

import { useMemo } from "react";

import {
  FeedbackMessages,
  useWorkspaceOperations,
} from "@/components/communication-workspace/workspace-operations-panel";
import { InspectorShell } from "@/components/customer-passport/inspector/primitives";
import {
  PassportAssignedSalesSection,
  PassportBookingSection,
  PassportIdentitySection,
  PassportJourneySection,
  PassportLabelsSection,
  PassportNotesSection,
  PassportQuickActionsSection,
  PassportReminderSection,
} from "@/components/customer-passport/inspector/passport-sections";
import {
  getInspectorJourneyStatusLabel,
  hasInspectorBookingContext,
  mapPassportStageToInspectorJourney,
} from "@/lib/customer-passport/inspector-helpers";
import { mapPassportFromConversation } from "@/lib/customer-passport/map-from-conversation";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";

type CustomerPassportInspectorProps = {
  conversation: OmnichannelConversationDetail;
  orgProfiles: Array<{ id: string; full_name: string }>;
  canReassign: boolean;
  canUpdateStatus: boolean;
  canAddNote: boolean;
  canConvert: boolean;
  canCreateFollowUp: boolean;
};

export function CustomerPassportInspector({
  conversation,
  orgProfiles,
  canReassign,
  canAddNote,
  canConvert,
  canCreateFollowUp,
}: CustomerPassportInspectorProps) {
  const passport = useMemo(
    () => mapPassportFromConversation(conversation),
    [conversation],
  );

  const currentJourneyStage = mapPassportStageToInspectorJourney(
    passport.journey.currentStage,
  );
  const journeyLabel = getInspectorJourneyStatusLabel(currentJourneyStage);
  const hasBooking = hasInspectorBookingContext(conversation);
  const lead = conversation.leadContext;
  const phone = passport.identity.phone;

  const ops = useWorkspaceOperations({
    conversation,
    canConvert,
  });

  return (
    <InspectorShell>
      <PassportIdentitySection
        passport={passport}
        conversation={conversation}
        journeyLabel={journeyLabel}
        phone={phone}
      />

      <PassportAssignedSalesSection
        conversation={conversation}
        orgProfiles={orgProfiles}
        canReassign={canReassign}
        ops={ops}
      />

      <PassportJourneySection currentStage={currentJourneyStage} />

      {hasBooking ? (
        <PassportBookingSection
          conversation={conversation}
          passport={passport}
          lead={lead}
        />
      ) : null}

      <div className="px-5 py-2">
        <FeedbackMessages
          feedback={ops.feedback}
          error={ops.error}
          compact
        />
      </div>

      <PassportQuickActionsSection
        conversation={conversation}
        phone={phone}
        hasBooking={hasBooking}
        canConvert={canConvert}
        onConvert={ops.handleConvert}
        isPending={ops.isPending}
      />

      <PassportNotesSection
        conversation={conversation}
        canAddNote={canAddNote}
        ops={ops}
      />

      <PassportReminderSection
        conversation={conversation}
        canCreateFollowUp={canCreateFollowUp}
        ops={ops}
      />

      <PassportLabelsSection conversation={conversation} ops={ops} />
    </InspectorShell>
  );
}
