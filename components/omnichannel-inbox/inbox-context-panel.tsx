"use client";

import { User } from "lucide-react";

import { CustomerSnapshot } from "@/components/omnichannel-inbox/customer-360/customer-snapshot";
import { InboxEmptyState } from "@/components/omnichannel-inbox/inbox-empty-state";
import {
  AURORA_CONTEXT_PANEL_WIDTH,
} from "@/components/workspace/aurora-tokens";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { cn } from "@/lib/utils";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";

function ContextPanelEmptyState() {
  const { ti } = useInboxTranslation();

  return (
    <InboxEmptyState
      icon={User}
      title={ti("selectConversationEmpty")}
      description={ti("contextPanelSelectDesc")}
      variant="compact"
      className="h-full min-h-[280px]"
    />
  );
}

type InboxContextPanelProps = {
  conversation: OmnichannelConversationDetail | null;
  className?: string;
};

/**
 * Aurora Context Panel — premium CRM side rail bound to the selected conversation.
 */
export function InboxContextPanel({
  conversation,
  className,
}: InboxContextPanelProps) {
  return (
    <aside
      className={cn(
        AURORA_CONTEXT_PANEL_WIDTH,
        "hidden h-full min-h-0 shrink-0 flex-col overflow-hidden border-l border-border/15 bg-background lg:flex",
        className,
      )}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {!conversation ? (
          <ContextPanelEmptyState />
        ) : (
          <CustomerSnapshot conversation={conversation} />
        )}
      </div>
    </aside>
  );
}
