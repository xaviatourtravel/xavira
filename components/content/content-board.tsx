"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { updateContentBoardStatus } from "@/app/(dashboard)/content/actions";
import { ContentBoardCard } from "@/components/content/content-board-card";
import {
  CONTENT_STATUS_OPTIONS,
  formatContentStatusLabel,
  type ContentStatus,
} from "@/lib/content/constants";
import type { ContentBoardItem } from "@/lib/content/queries";
import type { ContentInstagramMetrics } from "@/lib/instagram/queries";
import { cn } from "@/lib/utils";

type ContentBoardProps = {
  items: ContentBoardItem[];
  instagramMetricsByMediaId?: Record<string, ContentInstagramMetrics>;
  instagramInsightsGranted?: boolean;
  canManage: boolean;
};

const DRAG_DATA_KEY = "application/x-xavira-content-id";

export function ContentBoard({
  items: initialItems,
  instagramMetricsByMediaId,
  instagramInsightsGranted = false,
  canManage,
}: ContentBoardProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<ContentStatus | null>(
    null,
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const itemsByStatus = useMemo(() => {
    const grouped = Object.fromEntries(
      CONTENT_STATUS_OPTIONS.map((status) => [status.value, [] as ContentBoardItem[]]),
    ) as Record<ContentStatus, ContentBoardItem[]>;

    for (const item of items) {
      const status = CONTENT_STATUS_OPTIONS.some(
        (option) => option.value === item.status,
      )
        ? (item.status as ContentStatus)
        : "idea";
      grouped[status].push(item);
    }

    return grouped;
  }, [items]);

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message });
    window.setTimeout(() => {
      setFeedback(null);
    }, 3000);
  }

  function handleDragStart(contentId: string) {
    setDraggingId(contentId);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDropTargetStatus(null);
  }

  function handleDrop(targetStatus: ContentStatus, contentId: string) {
    setDropTargetStatus(null);
    setDraggingId(null);

    const currentItem = items.find((item) => item.id === contentId);
    if (!currentItem || currentItem.status === targetStatus) {
      return;
    }

    const previousItems = items;
    setItems((current) =>
      current.map((item) =>
        item.id === contentId ? { ...item, status: targetStatus } : item,
      ),
    );

    startTransition(async () => {
      const result = await updateContentBoardStatus(contentId, targetStatus);

      if (!result.success) {
        setItems(previousItems);
        showFeedback("error", result.message ?? "Gagal memperbarui status.");
        return;
      }

      showFeedback(
        "success",
        result.message ??
          `Dipindahkan ke ${formatContentStatusLabel(targetStatus)}.`,
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {canManage && (
        <p className="text-xs text-muted-foreground">
          Klik kartu untuk buka detail. Gunakan ikon grip untuk drag antar
          kolom. Status tetap bisa diubah lewat halaman edit.
        </p>
      )}

      {feedback && (
        <div
          className={cn(
            "rounded-md p-3 text-sm",
            feedback.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600",
          )}
        >
          {feedback.message}
        </div>
      )}

      <div
        className={cn(
          "flex gap-3 overflow-x-auto pb-2",
          isPending && "opacity-90",
        )}
      >
        {CONTENT_STATUS_OPTIONS.map((status) => {
          const columnItems = itemsByStatus[status.value];
          const isEmpty = columnItems.length === 0;
          const isDropTarget = dropTargetStatus === status.value;

          return (
            <div
              key={status.value}
              className={cn(
                "w-[220px] shrink-0 rounded-xl border bg-muted/20 p-3 transition-colors",
                isEmpty ? "self-start" : "",
                isDropTarget &&
                  canManage &&
                  "border-primary bg-primary/5 ring-2 ring-primary/30",
              )}
              onDragOver={(event) => {
                if (!canManage || !draggingId) {
                  return;
                }

                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }}
              onDragEnter={(event) => {
                if (!canManage || !draggingId) {
                  return;
                }

                event.preventDefault();
                setDropTargetStatus(status.value);
              }}
              onDragLeave={(event) => {
                if (!canManage) {
                  return;
                }

                const nextTarget = event.relatedTarget as Node | null;
                if (nextTarget && event.currentTarget.contains(nextTarget)) {
                  return;
                }

                setDropTargetStatus((current) =>
                  current === status.value ? null : current,
                );
              }}
              onDrop={(event) => {
                if (!canManage) {
                  return;
                }

                event.preventDefault();
                const contentId =
                  event.dataTransfer.getData(DRAG_DATA_KEY) ||
                  event.dataTransfer.getData("text/plain");

                if (contentId) {
                  handleDrop(status.value, contentId);
                }
              }}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">{status.label}</h2>
                <span className="rounded-full bg-background px-2 py-0.5 text-[11px]">
                  {columnItems.length}
                </span>
              </div>

              <div className={cn("min-h-[72px] space-y-2", isEmpty && "min-h-0")}>
                {columnItems.map((item) => (
                  <ContentBoardCard
                    key={item.id}
                    item={item}
                    instagramMetrics={
                      item.instagram_media_id
                        ? instagramMetricsByMediaId?.[item.instagram_media_id]
                        : null
                    }
                    instagramInsightsGranted={instagramInsightsGranted}
                    canDrag={canManage}
                    isDragging={draggingId === item.id}
                    onDragStart={() => handleDragStart(item.id)}
                    onDragEnd={handleDragEnd}
                  />
                ))}

                {isEmpty && (
                  <p className="py-1 text-xs text-muted-foreground">Kosong</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
