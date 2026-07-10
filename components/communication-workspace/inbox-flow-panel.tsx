"use client";

import {
  AURORA_INBOX_FLOW_ITEM,
  AURORA_INBOX_FLOW_SECTION,
  AURORA_INBOX_FLOW_SECTION_TITLE,
  AURORA_INBOX_FLOW_WIDTH,
} from "@/components/workspace/aurora-tokens";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { cn } from "@/lib/utils";

type InboxFlowPanelProps = {
  className?: string;
};

function FlowPlaceholderItem({
  label,
  count,
}: {
  label: string;
  count?: number;
}) {
  return (
    <button type="button" className={AURORA_INBOX_FLOW_ITEM} aria-disabled>
      <span className="truncate">{label}</span>
      {count != null ? (
        <span className="shrink-0 tabular-nums text-muted-foreground/60">{count}</span>
      ) : null}
    </button>
  );
}

export function InboxFlowPanel({ className }: InboxFlowPanelProps) {
  const { ti } = useInboxTranslation();

  return (
    <aside
      className={cn(
        AURORA_INBOX_FLOW_WIDTH,
        "hidden min-h-0 shrink-0 flex-col overflow-hidden border-r border-border/25 bg-background lg:flex",
        className,
      )}
      aria-label={ti("inboxFlowTitle")}
    >
      <header className="shrink-0 border-b border-border/25 px-3 py-2.5">
        <h2 className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
          {ti("inboxFlowTitle")}
        </h2>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-2">
        <section className={AURORA_INBOX_FLOW_SECTION}>
          <h3 className={AURORA_INBOX_FLOW_SECTION_TITLE}>{ti("inboxFlowMyQueue")}</h3>
          <div className="space-y-0.5">
            <FlowPlaceholderItem label={ti("inboxFlowUnread")} count={0} />
            <FlowPlaceholderItem label={ti("inboxFlowNeedAction")} count={0} />
            <FlowPlaceholderItem label={ti("inboxFlowAiQueue")} count={0} />
            <FlowPlaceholderItem label={ti("inboxFlowClosed")} />
          </div>
        </section>

        <section className={cn(AURORA_INBOX_FLOW_SECTION, "mt-4")}>
          <h3 className={AURORA_INBOX_FLOW_SECTION_TITLE}>{ti("inboxFlowChannels")}</h3>
          <div className="space-y-0.5">
            <FlowPlaceholderItem label={ti("inboxFlowWhatsapp")} />
            <FlowPlaceholderItem label={ti("inboxFlowInstagram")} />
            <FlowPlaceholderItem label={ti("inboxFlowFacebook")} />
            <FlowPlaceholderItem label={ti("inboxFlowEmail")} />
          </div>
        </section>
      </div>
    </aside>
  );
}
