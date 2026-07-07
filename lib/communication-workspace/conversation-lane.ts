import { cn } from "@/lib/utils";

import {
  WORKSPACE_CONTENT_TRANSITION_CLASS,
  WORKSPACE_LANE_MAX_CLASS_CLOSED,
  WORKSPACE_LANE_MAX_CLASS_OPEN,
} from "@/lib/communication-workspace/types";

export function getConversationLaneClassName(
  inspectorOpen: boolean,
  className?: string,
) {
  return cn(
    "mx-auto w-full max-w-none px-4 xl:px-6",
    WORKSPACE_CONTENT_TRANSITION_CLASS,
    inspectorOpen ? WORKSPACE_LANE_MAX_CLASS_OPEN : WORKSPACE_LANE_MAX_CLASS_CLOSED,
    className,
  );
}

export function getBubbleMaxWidthClassName(inspectorOpen: boolean) {
  return cn(
    WORKSPACE_CONTENT_TRANSITION_CLASS,
    inspectorOpen
      ? "max-w-[min(540px,78%)]"
      : "max-w-[min(540px,78%)] lg:max-w-[min(540px,82%)]",
  );
}
