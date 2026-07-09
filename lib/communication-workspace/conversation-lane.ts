import { cn } from "@/lib/utils";

import { WORKSPACE_CONTENT_TRANSITION_CLASS } from "@/lib/communication-workspace/types";

import {
  AURORA_READING_LANE_CLASS,
} from "@/components/workspace/aurora-tokens";

/**
 * Centered reading lane for conversation header and composer alignment.
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

/** Centered message lane — the only reading area for conversation bubbles */
export const AURORA_MESSAGE_LANE_CLASS =
  "mx-auto w-full max-w-[740px] min-w-0 px-4 sm:px-5";

/** Bubble width cap relative to the message lane */
export const MESSAGE_BUBBLE_WIDTH_CLASS = "w-fit min-w-[3.5rem] max-w-[72%]";

export function getMessageLaneClassName(className?: string) {
  return cn(AURORA_MESSAGE_LANE_CLASS, className);
}

/** @deprecated Prefer MESSAGE_BUBBLE_WIDTH_CLASS — kept for callers using inline styles */
export function getBubbleStyle() {
  return {
    maxWidth: "72%",
    minWidth: "3.5rem",
    wordBreak: "normal",
    overflowWrap: "break-word",
  } as const;
}
