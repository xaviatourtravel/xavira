import Link from "next/link";

import type { InboxDashboardMetrics } from "@/lib/inbox/metrics";

type InboxOverviewCardProps = {
  metrics: InboxDashboardMetrics;
};

export function InboxOverviewCard({ metrics }: InboxOverviewCardProps) {
  return (
    <div className="rounded-xl border p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Inbox Lead Capture</h2>
          <p className="text-sm text-muted-foreground">
            Instagram dan Facebook DM yang dikonversi menjadi lead CRM.
          </p>
        </div>
        <Link href="/inbox" className="text-sm font-medium text-primary hover:underline">
          Buka Inbox
        </Link>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">New Conversations</p>
          <p className="mt-2 text-2xl font-bold">{metrics.newConversations}</p>
        </div>
        <div className="rounded-lg border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">Converted Leads</p>
          <p className="mt-2 text-2xl font-bold">{metrics.convertedLeads}</p>
        </div>
        <div className="rounded-lg border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">Conversion Rate</p>
          <p className="mt-2 text-2xl font-bold">{metrics.conversionRate}%</p>
        </div>
      </div>
    </div>
  );
}
