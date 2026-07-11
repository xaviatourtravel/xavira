import {
  Calendar,
  FileText,
  Languages,
  MessageSquare,
  NotebookPen,
  Package,
  PenLine,
  Sparkles,
  Tag,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { SmartReplyIconId } from "./types";

const SMART_REPLY_ICONS: Record<SmartReplyIconId, LucideIcon> = {
  sparkles: Sparkles,
  "file-text": FileText,
  package: Package,
  calendar: Calendar,
  wallet: Wallet,
  languages: Languages,
  "pen-line": PenLine,
  "notebook-pen": NotebookPen,
  tag: Tag,
  "message-square": MessageSquare,
};

export function resolveSmartReplyIcon(iconId: SmartReplyIconId): LucideIcon {
  return SMART_REPLY_ICONS[iconId];
}
