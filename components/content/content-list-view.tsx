"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  formatContentPlatformLabel,
  formatContentStatusLabel,
  formatContentTypeLabel,
} from "@/lib/content/constants";
import {
  formatContentPublishDate,
  type ContentPlanningFilters,
} from "@/lib/content/planning-view";
import {
  getContentAssigneeName,
  getContentRelationName,
  type ContentBoardItem,
} from "@/lib/content/queries";
import { cn } from "@/lib/utils";

type ContentListViewProps = {
  items: ContentBoardItem[];
  canManage: boolean;
  filters: ContentPlanningFilters;
};

export function ContentListView({
  items,
  canManage,
  filters,
}: ContentListViewProps) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[980px] text-sm">
        <thead className="border-b bg-muted/50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Publish Date</th>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Platform</th>
            <th className="px-4 py-3 font-medium">Content Type</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Assigned To</th>
            <th className="px-4 py-3 font-medium">Campaign</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const assigneeName = getContentAssigneeName(item.profiles);
            const campaignName = getContentRelationName(item.campaigns);

            return (
              <tr
                key={item.id}
                className="cursor-pointer border-b last:border-b-0 hover:bg-muted/30"
                onClick={() => router.push(`/content/${item.id}`)}
              >
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {formatContentPublishDate(item.publish_date)}
                </td>
                <td className="px-4 py-3 font-medium">{item.title}</td>
                <td className="px-4 py-3">
                  {formatContentPlatformLabel(item.platform)}
                </td>
                <td className="px-4 py-3">
                  {formatContentTypeLabel(item.content_type)}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs">
                    {formatContentStatusLabel(item.status)}
                  </span>
                </td>
                <td className="px-4 py-3">{assigneeName ?? "-"}</td>
                <td className="px-4 py-3">{campaignName ?? "-"}</td>
                <td className="px-4 py-3">
                  <div
                    className="flex flex-wrap gap-2"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Link
                      href={`/content/${item.id}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                      )}
                    >
                      View
                    </Link>
                    {canManage && (
                      <Link
                        href={`/content/${item.id}/edit?view=${filters.view}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                        )}
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
