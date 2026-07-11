import {
  Brain,
  CheckCircle,
  Clipboard,
  Lightbulb,
  MessageSquare,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";

import type { AICopilotIconId } from "./types";

const COPILOT_ICONS: Record<AICopilotIconId, LucideIcon> = {
  sparkles: Sparkles,
  brain: Brain,
  target: Target,
  lightbulb: Lightbulb,
  clipboard: Clipboard,
  "message-square": MessageSquare,
  "check-circle": CheckCircle,
};

export function resolveCopilotIcon(iconId: AICopilotIconId): LucideIcon {
  return COPILOT_ICONS[iconId];
}
