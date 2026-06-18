import Link from "next/link";

import { ContentBoard } from "@/components/content/content-board";
import { ContentCalendarView } from "@/components/content/content-calendar-view";
import { ContentListView } from "@/components/content/content-list-view";
import { ContentPlanningFiltersBar } from "@/components/content/content-planning-filters";
import { ContentViewToggle } from "@/components/content/content-view-toggle";
import { buttonVariants } from "@/components/ui/button";
import type { ContentBoardItem } from "@/lib/content/queries";
import {
  filterContentItems,
  hasActiveContentPlanningFilters,
  parseContentPlanningFilters,
  sortContentByPublishDate,
  type ContentPlanningSearchParams,
} from "@/lib/content/planning-view";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import {
  loadContentInstagramMetricsMap,
  loadInstagramConnectionStatus,
} from "@/lib/instagram/queries";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<ContentPlanningSearchParams & { error?: string }>;
}) {
  const params = await searchParams;
  const filters = parseContentPlanningFilters(params);
  const { profile } = await requireProfile();
  const canManageContent = isAdminOrOwner(profile);
  const supabase = await createClient();

  const [{ data: contents, error }, { data: orgProfiles }] = await Promise.all([
    supabase
      .from("contents")
      .select(
        `
        id,
        title,
        platform,
        content_type,
        status,
        publish_date,
        assigned_to,
        instagram_media_id,
        campaigns (
          name
        ),
        profiles!contents_assigned_to_fkey (
          full_name
        )
      `,
      )
      .eq("organization_id", profile.organization_id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("organization_id", profile.organization_id)
      .order("full_name"),
  ]);

  if (error) {
    throw new Error("Gagal memuat content board.");
  }

  const items = (contents ?? []) as ContentBoardItem[];
  const instagramMediaIds = items
    .filter((item) => item.platform === "instagram" && item.instagram_media_id)
    .map((item) => item.instagram_media_id as string);
  const instagramConnection = await loadInstagramConnectionStatus(
    supabase,
    profile.organization_id,
  );
  const instagramMetricsByMediaId = await loadContentInstagramMetricsMap(
    supabase,
    profile.organization_id,
    instagramMediaIds,
    instagramConnection.insightsGranted,
  );
  const filteredItems = filterContentItems(items, filters, profile.id);
  const listItems = sortContentByPublishDate(filteredItems);
  const hasFilters = hasActiveContentPlanningFilters(filters);
  const showPlanningFilters =
    items.length > 0 && (filters.view !== "board" || hasFilters);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Content</h1>
          <p className="text-sm text-muted-foreground">
            {canManageContent
              ? "Kelola alur kerja konten media — board, list, atau calendar view."
              : "Lihat rencana dan alur kerja konten media tim Anda."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/content/instagram-analytics"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Instagram Analytics
          </Link>
          {canManageContent && (
            <>
              <Link
                href="/content/studio"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                ✨ AI Content Studio
              </Link>
              <Link href="/content/new" className={cn(buttonVariants())}>
                New Content
              </Link>
            </>
          )}
        </div>
      </div>

      {params?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(params.error)}
        </div>
      )}

      {items.length > 0 && <ContentViewToggle filters={filters} />}

      {showPlanningFilters && (
        <ContentPlanningFiltersBar
          filters={filters}
          orgProfiles={orgProfiles ?? []}
        />
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2 className="text-lg font-medium">Belum ada content</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {canManageContent
              ? "Mulai dengan content pertama untuk tim media."
              : "Belum ada content di board organisasi Anda."}
          </p>
          {canManageContent && (
            <Link
              href="/content/new"
              className={cn(buttonVariants(), "mt-4 inline-flex")}
            >
              New Content
            </Link>
          )}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2 className="text-lg font-medium">Tidak ada content yang cocok</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Coba ubah filter platform, status, atau assignee.
          </p>
          <Link
            href={`/content?view=${filters.view}`}
            className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex")}
          >
            Reset Filter
          </Link>
        </div>
      ) : filters.view === "list" ? (
        <ContentListView
          items={listItems}
          canManage={canManageContent}
          filters={filters}
          instagramMetricsByMediaId={instagramMetricsByMediaId}
          instagramInsightsGranted={instagramConnection.insightsGranted}
        />
      ) : filters.view === "calendar" ? (
        <ContentCalendarView items={filteredItems} />
      ) : (
        <ContentBoard
          items={filteredItems}
          instagramMetricsByMediaId={instagramMetricsByMediaId}
          instagramInsightsGranted={instagramConnection.insightsGranted}
          canManage={canManageContent}
        />
      )}
    </div>
  );
}
