"use client";

import { useMemo, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatLeadTimelineDateTime,
  getLeadTimelineEventBadgeClassName,
  getLeadTimelineEventDotClassName,
  getLeadTimelineEventTypeLabel,
  LEAD_TIMELINE_EVENT_TYPES,
  type LeadTimelineEvent,
  type LeadTimelineEventType,
} from "@/lib/leads/timeline";
import { cn } from "@/lib/utils";

type LeadTimelineCardProps = {
  leadId: string;
  events: LeadTimelineEvent[];
  createLeadActivity: (formData: FormData) => Promise<void>;
  showComposer?: boolean;
  title?: string;
  description?: string;
};

const inputClassName = "mt-1 w-full rounded-md border px-3 py-2 text-sm";

function shouldShowExpandableDetails(details: string | null) {
  if (!details) {
    return false;
  }

  const lineCount = details.split(/\r?\n/).length;
  return details.length > 120 || lineCount > 2;
}

function TimelineEventItem({ event }: { event: LeadTimelineEvent }) {
  const [expanded, setExpanded] = useState(false);
  const hasExpandableDetails = shouldShowExpandableDetails(event.details);

  return (
    <li className="relative pl-8">
      <span
        aria-hidden
        className={cn(
          "absolute left-[7px] top-2 h-2.5 w-2.5 rounded-full ring-4 ring-background",
          getLeadTimelineEventDotClassName(event.eventType),
        )}
      />

      <div className="rounded-lg border bg-card p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-[11px] font-medium",
                  getLeadTimelineEventBadgeClassName(event.eventType),
                )}
              >
                {getLeadTimelineEventTypeLabel(event.eventType)}
              </span>

              <time
                dateTime={event.occurredAt}
                className="text-[11px] text-muted-foreground"
              >
                {formatLeadTimelineDateTime(event.occurredAt)}
              </time>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold leading-snug">
                {event.description}
              </p>
              <p className="text-xs text-muted-foreground">
                oleh {event.userName}
              </p>
            </div>
          </div>
        </div>

        {event.details && (
          <div className="mt-3 border-t pt-3">
            <p
              className={cn(
                "whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground",
                hasExpandableDetails && !expanded && "line-clamp-3",
              )}
            >
              {event.details}
            </p>

            {hasExpandableDetails && (
              <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                className="mt-2 text-xs font-medium text-primary hover:underline"
              >
                {expanded ? "Sembunyikan detail" : "Lihat detail"}
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function LeadTimelineCard({
  leadId,
  events,
  createLeadActivity,
  showComposer = true,
  title = "📜 Timeline",
  description = "Riwayat kronologis lengkap untuk lead ini.",
}: LeadTimelineCardProps) {
  const [eventTypeFilter, setEventTypeFilter] = useState<
    LeadTimelineEventType | "all"
  >("all");
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const filteredEvents = useMemo(() => {
    if (eventTypeFilter === "all") {
      return events;
    }

    return events.filter((event) => event.eventType === eventTypeFilter);
  }, [eventTypeFilter, events]);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <button
            type="button"
            className="min-h-[44px] rounded-lg border px-3 text-sm font-medium lg:hidden"
            onClick={() => setMobileExpanded((value) => !value)}
          >
            {mobileExpanded ? "Hide" : `Show (${events.length})`}
          </button>
        </div>

        <div className={cn("max-w-xs", !mobileExpanded && "hidden lg:block")}>
          <label
            htmlFor="timeline-event-filter"
            className="text-sm font-medium"
          >
            Filter jenis event
          </label>
          <select
            id="timeline-event-filter"
            value={eventTypeFilter}
            onChange={(event) =>
              setEventTypeFilter(
                event.target.value as LeadTimelineEventType | "all",
              )
            }
            className={inputClassName}
          >
            <option value="all">Semua jenis</option>
            {LEAD_TIMELINE_EVENT_TYPES.map((eventType) => (
              <option key={eventType} value={eventType}>
                {getLeadTimelineEventTypeLabel(eventType)}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>

      <CardContent className={cn("space-y-6", !mobileExpanded && "hidden lg:block")}>
        {filteredEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {events.length === 0
              ? "Belum ada event untuk lead ini."
              : "Tidak ada event yang cocok dengan filter ini."}
          </p>
        ) : (
          <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[10px] before:top-2 before:w-px before:bg-border">
            {filteredEvents.map((event) => (
              <TimelineEventItem key={event.id} event={event} />
            ))}
          </ol>
        )}

        {showComposer ? (
        <form
          action={createLeadActivity}
          className="space-y-4 rounded-lg border p-4"
        >
          <input type="hidden" name="lead_id" value={leadId} />

          <div>
            <p className="text-sm font-medium">Tambah Catatan</p>
            <p className="text-xs text-muted-foreground">
              Catatan manual akan muncul di timeline sebagai aktivitas baru.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Jenis Aktivitas</label>
            <select
              name="activity_type"
              defaultValue="note"
              className={inputClassName}
            >
              <option value="note">Catatan</option>
              <option value="call">Telepon</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Judul</label>
            <input
              name="title"
              className={inputClassName}
              placeholder="Contoh: Follow up harga paket"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Isi</label>
            <textarea
              name="body"
              rows={3}
              className={inputClassName}
              placeholder="Tulis detail aktivitas..."
            />
          </div>

          <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
            Tambah Aktivitas
          </button>
        </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
