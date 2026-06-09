import Link from "next/link";

import {
  formatContentPlatformLabel,
  formatContentTypeLabel,
} from "@/lib/content/constants";
import {
  getContentAssigneeName,
  getContentRelationName,
  type ContentBoardItem,
} from "@/lib/content/queries";
import { cn } from "@/lib/utils";

type ContentBoardCardProps = {
  item: ContentBoardItem;
};

function formatPublishDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function ContentBoardCard({ item }: ContentBoardCardProps) {
  const campaignName = getContentRelationName(item.campaigns);
  const assigneeName = getContentAssigneeName(item.profiles);
  const publishDate = formatPublishDate(item.publish_date);

  return (
    <Link
      href={`/content/${item.id}`}
      className={cn(
        "block rounded-lg border bg-background p-3 shadow-sm transition-colors hover:bg-accent/40",
      )}
    >
      <p className="text-sm font-medium leading-snug">{item.title}</p>

      <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
        <p>{formatContentPlatformLabel(item.platform)}</p>
        <p>{formatContentTypeLabel(item.content_type)}</p>
        {campaignName && <p>Campaign: {campaignName}</p>}
        {assigneeName && <p>Assigned: {assigneeName}</p>}
        {publishDate && <p>Publish: {publishDate}</p>}
      </div>
    </Link>
  );
}
