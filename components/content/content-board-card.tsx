import Link from "next/link";
import { GripVertical } from "lucide-react";

import { ContentInstagramMetricsBadge } from "@/components/content/content-instagram-metrics-badge";
import {
  formatContentPlatformLabel,
  formatContentTypeLabel,
} from "@/lib/content/constants";
import {
  getContentAssigneeName,
  getContentRelationName,
  type ContentBoardItem,
} from "@/lib/content/queries";
import type { ContentInstagramMetrics } from "@/lib/instagram/queries";
import { cn } from "@/lib/utils";

type ContentBoardCardProps = {
  item: ContentBoardItem;
  instagramMetrics?: ContentInstagramMetrics | null;
  instagramInsightsGranted?: boolean;
  canDrag?: boolean;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

const DRAG_DATA_KEY = "application/x-xavira-content-id";

function formatPublishDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function ContentBoardCard({
  item,
  instagramMetrics,
  instagramInsightsGranted = false,
  canDrag = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
}: ContentBoardCardProps) {
  const campaignName = getContentRelationName(item.campaigns);
  const assigneeName = getContentAssigneeName(item.profiles);
  const publishDate = formatPublishDate(item.publish_date);

  const cardBody = (
    <>
      <p className="text-sm font-medium leading-snug">{item.title}</p>

      <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
        <p>{formatContentPlatformLabel(item.platform)}</p>
        <p>{formatContentTypeLabel(item.content_type)}</p>
        {campaignName && <p>Campaign: {campaignName}</p>}
        {assigneeName && <p>Assigned: {assigneeName}</p>}
        {publishDate && <p>Publish: {publishDate}</p>}
        {item.status === "published" &&
        item.platform === "instagram" &&
        instagramMetrics ? (
          <ContentInstagramMetricsBadge
            metrics={instagramMetrics}
            insightsGranted={instagramInsightsGranted}
          />
        ) : null}
      </div>
    </>
  );

  if (!canDrag) {
    return (
      <Link
        href={`/content/${item.id}`}
        className={cn(
          "block rounded-lg border bg-background p-3 shadow-sm transition-colors hover:bg-accent/40",
        )}
      >
        {cardBody}
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-background p-2 shadow-sm transition-opacity",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex items-start gap-1">
        <button
          type="button"
          draggable
          aria-label={`Pindahkan ${item.title}`}
          title="Drag untuk pindah kolom"
          className={cn(
            "mt-0.5 shrink-0 rounded p-1 text-muted-foreground touch-none",
            "cursor-grab hover:bg-muted active:cursor-grabbing",
          )}
          onDragStart={(event) => {
            event.dataTransfer.setData(DRAG_DATA_KEY, item.id);
            event.dataTransfer.setData("text/plain", item.id);
            event.dataTransfer.effectAllowed = "move";
            onDragStart?.();
          }}
          onDragEnd={() => {
            onDragEnd?.();
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>

        <Link
          href={`/content/${item.id}`}
          className={cn(
            "min-w-0 flex-1 rounded-md p-1 transition-colors hover:bg-accent/40",
          )}
        >
          {cardBody}
        </Link>
      </div>
    </div>
  );
}
