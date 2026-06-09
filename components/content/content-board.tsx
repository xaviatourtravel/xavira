import { ContentBoardCard } from "@/components/content/content-board-card";
import { CONTENT_STATUS_OPTIONS } from "@/lib/content/constants";
import type { ContentBoardItem } from "@/lib/content/queries";
import { cn } from "@/lib/utils";

type ContentBoardProps = {
  items: ContentBoardItem[];
};

export function ContentBoard({ items }: ContentBoardProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {CONTENT_STATUS_OPTIONS.map((status) => {
        const columnItems = items.filter((item) => item.status === status.value);
        const isEmpty = columnItems.length === 0;

        return (
          <div
            key={status.value}
            className={cn(
              "w-[220px] shrink-0 rounded-xl border bg-muted/20 p-3",
              isEmpty ? "self-start" : "",
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">{status.label}</h2>
              <span className="rounded-full bg-background px-2 py-0.5 text-[11px]">
                {columnItems.length}
              </span>
            </div>

            <div className={cn("space-y-2", isEmpty && "min-h-0")}>
              {columnItems.map((item) => (
                <ContentBoardCard key={item.id} item={item} />
              ))}

              {isEmpty && (
                <p className="py-1 text-xs text-muted-foreground">Kosong</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
