"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  FileText,
  Fingerprint,
  Package,
  Rocket,
  ShieldCheck,
} from "lucide-react";

import { formatTimelineRelativeTime } from "@/modules/business-brain/lib/format-timeline-relative-time";
import type {
  BusinessBrainTimelineEvent,
  BusinessBrainTimelineEventType,
  BusinessBrainTimelineResult,
} from "@/modules/business-brain/types/business-brain-timeline";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

function TimelineRelativeTime({
  date,
  className,
}: {
  date: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [label, setLabel] = useState("...");

  useEffect(() => {
    setMounted(true);
    const update = () => setLabel(formatTimelineRelativeTime(date));
    update();
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, [date]);

  return (
    <span className={cn("tabular-nums", className)} suppressHydrationWarning>
      {mounted ? label : "..."}
    </span>
  );
}

const EVENT_ICONS: Record<BusinessBrainTimelineEventType, LucideIcon> = {
  "identity-updated": Fingerprint,
  "product-created": Package,
  "product-updated": Package,
  "knowledge-created": BookOpen,
  "knowledge-updated": BookOpen,
  "knowledge-published": BookOpen,
  "document-uploaded": FileText,
  "document-updated": FileText,
  "document-published": FileText,
  "rules-updated": ShieldCheck,
  "publish-completed": Rocket,
  "business-brain-published": Rocket,
};

type BusinessBrainTimelineSectionProps = {
  timeline: BusinessBrainTimelineResult;
};

function TimelineItem({ event }: { event: BusinessBrainTimelineEvent }) {
  const Icon = EVENT_ICONS[event.type];

  return (
    <li className="relative flex gap-3 pb-6 last:pb-0">
      <div className="relative flex flex-col items-center">
        <span className="relative z-10 mt-1 flex h-2 w-2 shrink-0 rounded-full bg-primary ring-4 ring-background" />
      </div>
      <div className="min-w-0 flex-1 pt-0">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <div className="flex min-w-0 items-start gap-2">
            <Icon
              className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
              strokeWidth={1.75}
              aria-hidden
            />
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium text-foreground">{event.title}</p>
              <p className="text-sm text-muted-foreground">{event.description}</p>
            </div>
          </div>
          <TimelineRelativeTime
            date={event.occurredAt}
            className="shrink-0 text-xs text-muted-foreground"
          />
        </div>
      </div>
    </li>
  );
}

function TimelineEmptyState() {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
      <p className="text-sm font-medium text-foreground">{t("businessBrain.noActivityYet")}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("businessBrain.noActivityDescription")}
      </p>
    </div>
  );
}

export function BusinessBrainTimelineSection({ timeline }: BusinessBrainTimelineSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          {t("businessBrain.recentActivity")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("businessBrain.recentActivityDescription")}
        </p>
      </div>

      {timeline.events.length === 0 ? (
        <TimelineEmptyState />
      ) : (
        <ol
          className={cn(
            "relative pl-1",
            "before:absolute before:bottom-2 before:left-[3px] before:top-2 before:w-px before:bg-border",
          )}
        >
          {timeline.events.map((event) => (
            <TimelineItem key={event.id} event={event} />
          ))}
        </ol>
      )}
    </div>
  );
}
