"use client";

import { useMemo, useState } from "react";
import { Bot, ShieldAlert } from "lucide-react";

import { formatInboxMessageTime } from "@/components/omnichannel-inbox/inbox-display";
import type {
  AiActivityFilter,
  WhatsappAiAuditEvent,
} from "@/lib/whatsapp-inbox/ai/activity-events";
import { matchesAiActivityFilter } from "@/lib/whatsapp-inbox/ai/activity-events";
import { cn } from "@/lib/utils";

const FILTER_OPTIONS: Array<{ id: AiActivityFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "replies", label: "Replies" },
  { id: "handoffs", label: "Handoffs" },
  { id: "skipped", label: "Skipped" },
  { id: "documents", label: "Documents" },
  { id: "errors", label: "Errors" },
];

function formatConfidenceLabel(confidence: number) {
  const percent = confidence <= 1 ? confidence * 100 : confidence;
  return `${Math.round(percent)}%`;
}

function AiAuditEventItem({ event }: { event: WhatsappAiAuditEvent }) {
  return (
    <article className="rounded-lg border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{event.label}</p>
        <time className="shrink-0 text-[11px] text-muted-foreground">
          {formatInboxMessageTime(event.timestamp)}
        </time>
      </div>

      {event.reason ? (
        <p className="mt-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">Reason:</span> {event.reason}
        </p>
      ) : null}

      {event.confidence != null ? (
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">Confidence:</span>{" "}
          {formatConfidenceLabel(event.confidence)}
        </p>
      ) : null}

      {event.intent ? (
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">Intent:</span> {event.intent}
        </p>
      ) : null}

      {event.usedSources && event.usedSources.length > 0 ? (
        <div className="mt-2">
          <p className="text-[11px] font-medium text-foreground/80">Sources used</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {event.usedSources.map((source) => (
              <span
                key={`${event.id}-${source}`}
                className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] text-violet-700"
              >
                {source}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {event.documentAction ? (
        <p className="mt-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">Document:</span>{" "}
          {event.documentAction}
        </p>
      ) : null}

      {event.detail ? (
        <p className="mt-1.5 line-clamp-3 text-xs text-muted-foreground">{event.detail}</p>
      ) : null}
    </article>
  );
}

type AiActivityAuditPanelProps = {
  events: WhatsappAiAuditEvent[];
};

export function AiActivityAuditPanel({ events }: AiActivityAuditPanelProps) {
  const [filter, setFilter] = useState<AiActivityFilter>("all");

  const filteredEvents = useMemo(
    () => events.filter((event) => matchesAiActivityFilter(event, filter)),
    [events, filter],
  );

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-violet-600" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              AI Activity
            </p>
            <p className="text-[10px] text-muted-foreground">Internal only</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
          <ShieldAlert className="h-3 w-3" />
          Team view
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setFilter(option.id)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
              filter === option.id
                ? "border-violet-200 bg-violet-50 text-violet-700"
                : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filteredEvents.length === 0 ? (
        <p className="text-xs text-muted-foreground">No AI activity yet.</p>
      ) : (
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {filteredEvents.map((event) => (
            <AiAuditEventItem key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
