import { memo } from "react";
import { Clock3, MessageSquare, StickyNote } from "lucide-react";

import {
  IntelligenceEmpty,
  IntelligenceSection,
} from "@/components/communication-workspace/primitives";
import { formatInboxMessageTime } from "@/components/omnichannel-inbox/inbox-display";
import type { WorkspaceTimelineEntry } from "@/lib/communication-workspace/types";
import { cn } from "@/lib/utils";

function TimelineIcon({ tone }: { tone: WorkspaceTimelineEntry["tone"] }) {
  const className = "h-3.5 w-3.5";

  if (tone === "note") {
    return <StickyNote className={className} />;
  }

  if (tone === "message") {
    return <MessageSquare className={className} />;
  }

  return <Clock3 className={className} />;
}

type TimelineSectionProps = {
  timeline: WorkspaceTimelineEntry[];
};

export const TimelineSection = memo(function TimelineSection({
  timeline,
}: TimelineSectionProps) {
  return (
    <IntelligenceSection title="Timeline">
      {timeline.length === 0 ? (
        <IntelligenceEmpty>
          Every touchpoint across WhatsApp, Instagram, Email, and more will
          appear in one unified timeline.
        </IntelligenceEmpty>
      ) : (
        <div className="space-y-0">
          {timeline.map((entry, index) => (
            <div key={entry.id} className="relative flex gap-3 pb-4">
              {index < timeline.length - 1 ? (
                <span className="absolute left-[13px] top-7 bottom-0 w-px bg-neutral-200 dark:bg-neutral-800" />
              ) : null}
              <span
                className={cn(
                  "relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-200/80 bg-white text-muted-foreground dark:border-neutral-800 dark:bg-neutral-950",
                  entry.tone === "message" && "text-sky-600",
                  entry.tone === "note" && "text-amber-600",
                  entry.tone === "activity" && "text-violet-600",
                )}
              >
                <TimelineIcon tone={entry.tone} />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs font-medium text-foreground">{entry.label}</p>
                {entry.detail ? (
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                    {entry.detail}
                  </p>
                ) : null}
                <p className="mt-1.5 text-[10px] text-muted-foreground/80">
                  {formatInboxMessageTime(entry.timestamp)}
                  {entry.channel ? ` · ${entry.channel}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </IntelligenceSection>
  );
});
