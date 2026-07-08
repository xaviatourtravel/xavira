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
    "mx-auto w-full px-4 xl:px-6",
    WORKSPACE_CONTENT_TRANSITION_CLASS,
    inspectorOpen ? WORKSPACE_LANE_MAX_CLASS_OPEN : WORKSPACE_LANE_MAX_CLASS_CLOSED,
    className,
  );
}

export function getBubbleStyle() {
  return {
    maxWidth: "min(68%, 560px)",
    minWidth: "72px",
    wordBreak: "normal",
    overflowWrap: "break-word",
  } as const;
}
