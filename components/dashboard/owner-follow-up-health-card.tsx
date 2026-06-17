import Link from "next/link";

import type { FollowUpComplianceMetrics } from "@/lib/automation/compliance";

type OwnerFollowUpHealthCardProps = {
  totalLeads: number;
  overdueLeads: number;
  hotLeadsOverdue: number;
  compliance: FollowUpComplianceMetrics;
};

export function OwnerFollowUpHealthCard({
  totalLeads,
  overdueLeads,
  hotLeadsOverdue,
  compliance,
}: OwnerFollowUpHealthCardProps) {
  return (
    <div className="rounded-xl border p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Lead Follow Up Health</h2>
          <p className="text-sm text-muted-foreground">
            Pantau apakah lead ditindaklanjuti tepat waktu oleh tim sales.
          </p>
        </div>
        <Link
          href="/follow-ups/queue"
          className="text-sm font-medium text-primary hover:underline"
        >
          Buka Queue
        </Link>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">Total Leads</p>
          <p className="mt-2 text-2xl font-bold">{totalLeads}</p>
        </div>
        <div className="rounded-lg border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">Overdue Leads</p>
          <p className="mt-2 text-2xl font-bold text-red-600">{overdueLeads}</p>
        </div>
        <div className="rounded-lg border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">Hot Leads Overdue</p>
          <p className="mt-2 text-2xl font-bold text-orange-600">
            {hotLeadsOverdue}
          </p>
        </div>
        <div className="rounded-lg border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">Follow Up Compliance</p>
          <p className="mt-2 text-2xl font-bold">
            {compliance.today.complianceRate}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Today</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4 text-sm">
          <p className="font-medium">Today</p>
          <p className="mt-2 text-muted-foreground">
            {compliance.today.followedOnTime} /{" "}
            {compliance.today.totalRequiringFollowUp} followed on time
          </p>
        </div>
        <div className="rounded-lg border p-4 text-sm">
          <p className="font-medium">This Month</p>
          <p className="mt-2 text-muted-foreground">
            {compliance.thisMonth.complianceRate}% compliance (
            {compliance.thisMonth.followedOnTime} /{" "}
            {compliance.thisMonth.totalRequiringFollowUp})
          </p>
        </div>
      </div>
    </div>
  );
}
