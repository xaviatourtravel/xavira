import { InstagramConnectionCard } from "@/components/instagram/instagram-connection-card";
import { InstagramPillarPerformanceTable } from "@/components/instagram/instagram-pillar-performance-table";
import { InstagramPostsTable } from "@/components/instagram/instagram-posts-table";
import { InstagramSummaryCards } from "@/components/instagram/instagram-summary-cards";
import { InstagramTopPostsTable } from "@/components/instagram/instagram-top-posts-table";
import type { InstagramAnalyticsMetrics } from "@/lib/instagram/queries";

type InstagramAnalyticsViewProps = {
  metrics: InstagramAnalyticsMetrics;
  canManage: boolean;
  initialMessage?: string | null;
  initialError?: string | null;
};

export function InstagramAnalyticsView({
  metrics,
  canManage,
  initialMessage = null,
  initialError = null,
}: InstagramAnalyticsViewProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Instagram Analytics</h1>
        <p className="text-muted-foreground">
          Performa konten Instagram Business — tanpa keluar dari Desklabs.
        </p>
      </div>

      <InstagramConnectionCard
        connection={metrics.connection}
        canManage={canManage}
        initialMessage={initialMessage}
        initialError={initialError}
      />

      {metrics.hasData ? (
        <>
          <div>
            <h2 className="mb-4 text-lg font-semibold">Content Analytics</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Total performa dari {metrics.summary.postCount} post yang
              tersinkronisasi.
            </p>
            <InstagramSummaryCards
              summary={metrics.summary}
              insightsGranted={metrics.insightsGranted}
            />
          </div>

          <div className="rounded-xl border p-6">
            <h2 className="text-lg font-semibold">Top Performing Content</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Post dengan engagement tertinggi (likes + comments + saves).
            </p>
            <InstagramTopPostsTable
              rows={metrics.topPosts}
              insightsGranted={metrics.insightsGranted}
              canLink={canManage}
            />
          </div>

          <div className="rounded-xl border p-6">
            <h2 className="text-lg font-semibold">Synced Instagram Posts</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Semua post tersinkronisasi — hubungkan ke Content Board untuk
              melacak performa konten yang direncanakan.
            </p>
            <InstagramPostsTable
              rows={metrics.allPosts}
              insightsGranted={metrics.insightsGranted}
              canLink={canManage}
            />
          </div>

          <div className="rounded-xl border p-6">
            <h2 className="text-lg font-semibold">Content Pillar Performance</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Performa dikelompokkan berdasarkan content pillar dari Content
              Board / AI Studio.
            </p>
            <InstagramPillarPerformanceTable
              rows={metrics.pillarPerformance}
              insightsGranted={metrics.insightsGranted}
            />
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {metrics.connection.isConfigured
              ? "Klik Sync sekarang untuk memuat analytics dari Instagram."
              : "Hubungkan akun Instagram Business terlebih dahulu untuk melihat analytics."}
          </p>
        </div>
      )}
    </div>
  );
}
