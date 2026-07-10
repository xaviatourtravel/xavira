"use client";

import {
  AURORA_INBOX_FLOW_ITEM,
  AURORA_INBOX_FLOW_ITEM_SELECTED,
  AURORA_INBOX_FLOW_SECTION,
  AURORA_INBOX_FLOW_SECTION_TITLE,
  AURORA_INBOX_FLOW_WIDTH,
  AURORA_WORKSPACE_COLUMN_HEADER,
} from "@/components/workspace/aurora-tokens";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { cn } from "@/lib/utils";

type InboxFlowId =
  | "my-queue"
  | "unread"
  | "need-action"
  | "ai-queue"
  | "closed"
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "email";

type InboxFlowPanelProps = {
  className?: string;
  activeFlowId?: InboxFlowId;
  queueCount?: number;
};

function FlowPlaceholderItem({
  label,
  count,
  selected = false,
}: {
  label: string;
  count?: number;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      className={selected ? AURORA_INBOX_FLOW_ITEM_SELECTED : AURORA_INBOX_FLOW_ITEM}
      aria-current={selected ? "true" : undefined}
      aria-disabled
    >
      <span className="truncate">{label}</span>
      {count != null ? (
        <span
          className={cn(
            "shrink-0 tabular-nums",
            selected ? "text-primary/70" : "text-muted-foreground/60",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

export function InboxFlowPanel({
  className,
  activeFlowId = "my-queue",
  queueCount,
}: InboxFlowPanelProps) {
  const { ti } = useInboxTranslation();

  return (
    <aside
      className={cn(
        AURORA_INBOX_FLOW_WIDTH,
        "hidden min-h-0 shrink-0 flex-col overflow-hidden border-r border-border/15 bg-background lg:flex",
        className,
      )}
      aria-label={ti("inboxFlowTitle")}
    >
      <header className={cn(AURORA_WORKSPACE_COLUMN_HEADER, "py-3")}>
        <h2 className="truncate text-xl font-semibold leading-none tracking-tight text-foreground">
          {ti("inboxFlowTitle")}
        </h2>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-2">
        <section className={AURORA_INBOX_FLOW_SECTION}>
          <div className="space-y-0.5">
            <FlowPlaceholderItem
              label={ti("inboxFlowMyQueue")}
              count={queueCount}
              selected={activeFlowId === "my-queue"}
            />
            <FlowPlaceholderItem
              label={ti("inboxFlowUnread")}
              count={0}
              selected={activeFlowId === "unread"}
            />
            <FlowPlaceholderItem
              label={ti("inboxFlowNeedAction")}
              count={0}
              selected={activeFlowId === "need-action"}
            />
            <FlowPlaceholderItem
              label={ti("inboxFlowAiQueue")}
              count={0}
              selected={activeFlowId === "ai-queue"}
            />
            <FlowPlaceholderItem
              label={ti("inboxFlowClosed")}
              selected={activeFlowId === "closed"}
            />
          </div>
        </section>

        <section
          className={cn(
            AURORA_INBOX_FLOW_SECTION,
            "mt-4 border-t border-border/15 pt-4",
          )}
        >
          <h3 className={AURORA_INBOX_FLOW_SECTION_TITLE}>{ti("inboxFlowChannels")}</h3>
          <div className="space-y-0.5">
            <FlowPlaceholderItem
              label={ti("inboxFlowWhatsapp")}
              selected={activeFlowId === "whatsapp"}
            />
            <FlowPlaceholderItem
              label={ti("inboxFlowInstagram")}
              selected={activeFlowId === "instagram"}
            />
            <FlowPlaceholderItem
              label={ti("inboxFlowFacebook")}
              selected={activeFlowId === "facebook"}
            />
            <FlowPlaceholderItem
              label={ti("inboxFlowEmail")}
              selected={activeFlowId === "email"}
            />
          </div>
        </section>
      </div>
    </aside>
  );
}
