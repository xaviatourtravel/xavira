"use client";

import { useMemo, useRef, useState } from "react";
import { UserRound } from "lucide-react";

import {
  AssignOwnerSheet,
  MOCK_ASSIGNMENT_TEAM,
  OwnerCard,
  OwnershipHistory,
  useAssignmentState,
  type AssignmentLabels,
} from "@/components/assignment";
import {
  AURORA_ASSIGN_OWNER_BUTTON,
  AURORA_CONTEXT_CARD_CLASS,
} from "@/components/workspace/aurora-tokens";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { cn } from "@/lib/utils";

const SECTION_ICON_CLASS = "h-4 w-4 shrink-0 text-muted-foreground/55";
const SECTION_TITLE_CLASS = "text-[13px] font-semibold tracking-tight text-foreground";

function resolveInitialOwnerId(conversation: OmnichannelConversationDetail): string | null {
  const assignedName =
    conversation.assignedUserName?.trim() ||
    conversation.leadContext?.assignedToName?.trim() ||
    null;

  if (!assignedName) {
    return "adi";
  }

  const member = MOCK_ASSIGNMENT_TEAM.find((item) =>
    assignedName.toLowerCase().includes(item.name.split(" ")[0]?.toLowerCase() ?? ""),
  );

  return member?.id ?? "adi";
}

type AssignmentOwnershipSectionProps = {
  conversation: OmnichannelConversationDetail;
  className?: string;
};

export function AssignmentOwnershipSection({
  conversation,
  className,
}: AssignmentOwnershipSectionProps) {
  const { ti } = useInboxTranslation();
  const assignButtonRef = useRef<HTMLButtonElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const labels = useMemo<AssignmentLabels>(
    () => ({
      assignOwner: ti("assignmentAssignOwner"),
      sheetTitle: ti("assignmentSheetTitle"),
      sheetSubtext: ti("assignmentSheetSubtext"),
      searchPlaceholder: ti("assignmentSearchPlaceholder"),
      ownershipHistory: ti("assignmentOwnershipHistory"),
      unassigned: ti("assignmentUnassigned"),
      statusOnline: ti("assignmentStatusOnline"),
      statusAway: ti("assignmentStatusAway"),
      statusOffline: ti("assignmentStatusOffline"),
      workloadChats: ti("assignmentWorkloadChats"),
      closeAriaLabel: ti("assignmentSheetClose"),
    }),
    [ti],
  );

  const initialOwnerId = useMemo(
    () => resolveInitialOwnerId(conversation),
    [conversation],
  );

  const { owner, history, team, assignOwner } = useAssignmentState(
    conversation.id,
    initialOwnerId,
  );

  return (
    <section className={cn(AURORA_CONTEXT_CARD_CLASS, className)}>
      <div className="mb-4 flex items-center gap-2">
        <UserRound className={SECTION_ICON_CLASS} aria-hidden strokeWidth={1.75} />
        <h3 className={SECTION_TITLE_CLASS}>{ti("assignmentOwnerTitle")}</h3>
      </div>

      {owner ? (
        <OwnerCard owner={owner} labels={labels} />
      ) : (
        <div className="rounded-xl border border-dashed border-border/20 bg-muted/5 px-3 py-4 text-center">
          <p className="text-sm font-medium text-foreground">{labels.unassigned}</p>
        </div>
      )}

      <button
        ref={assignButtonRef}
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
        className={cn(AURORA_ASSIGN_OWNER_BUTTON, "mt-3 w-full")}
      >
        {labels.assignOwner}
      </button>

      <OwnershipHistory history={history} title={labels.ownershipHistory} />

      <AssignOwnerSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        team={team}
        currentOwnerId={owner?.id ?? null}
        onSelect={assignOwner}
        labels={labels}
        returnFocusRef={assignButtonRef}
      />
    </section>
  );
}
