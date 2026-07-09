import { cn } from "@/lib/utils";
import {
  AURORA_READING_LANE_CLASS,
} from "@/components/workspace/aurora-tokens";

import { WORKSPACE_CONTENT_TRANSITION_CLASS } from "@/lib/communication-workspace/types";

/**
 * Centered reading lane for conversation header, thread, and composer alignment.
 * @param _inspectorOpen Legacy param — permanent inspector removed; lane width is fixed.
 */
export function getConversationLaneClassName(
  _inspectorOpen: boolean,
  className?: string,
) {
  return cn(
    AURORA_READING_LANE_CLASS,
    WORKSPACE_CONTENT_TRANSITION_CLASS,
    className,
  );
}

/** Bubble width within the reading lane */
export function getBubbleStyle() {
  return {
    maxWidth: "88%",
    minWidth: "3.5rem",
    wordBreak: "normal",
    overflowWrap: "break-word",
  } as const;
}
