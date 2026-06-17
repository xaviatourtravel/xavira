import Link from "next/link";

import {
  formatContentPlatformLabel,
  formatContentStatusLabel,
} from "@/lib/content/constants";
import {
  CONTENT_CALENDAR_GROUPS,
  formatContentPublishDate,
  groupContentByPublishDate,
} from "@/lib/content/planning-view";
import {
  getContentAssigneeName,
  type ContentBoardItem,
} from "@/lib/content/queries";

type ContentCalendarViewProps = {
  items: ContentBoardItem[];
};

export function ContentCalendarView({ items }: ContentCalendarViewProps) {
  const groupedItems = groupContentByPublishDate(items);

  return (
    <div className="space-y-6">
      {CONTENT_CALENDAR_GROUPS.map((group) => {
        const groupItems = groupedItems[group.key];

        return (
          <section key={group.key} className="rounded-xl border">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold">{group.label}</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {groupItems.length}
              </span>
            </div>

            {groupItems.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                Tidak ada content di grup ini.
              </p>
            ) : (
              <ul className="divide-y">
                {groupItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/content/${item.id}`}
                      className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="font-medium">{item.title}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {item.publish_date && (
                            <span>{formatContentPublishDate(item.publish_date)}</span>
                          )}
                          <span>{formatContentPlatformLabel(item.platform)}</span>
                          <span>{formatContentStatusLabel(item.status)}</span>
                          <span>
                            Assigned: {getContentAssigneeName(item.profiles) ?? "-"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
