"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import type { PerformanceRow } from "@/lib/dashboard/revenue-intelligence";
import { ConversionBarChart } from "@/components/dashboard/revenue/conversion-bar-chart";
import { PerformanceTable } from "@/components/dashboard/revenue/performance-table";

type LeadSourcePerformanceCardProps = {
  sourceRows: PerformanceRow[];
  campaignRows: PerformanceRow[];
};

type GroupKey = "source" | "campaign";

const GROUPS: Array<{ key: GroupKey; label: string }> = [
  { key: "source", label: "Source" },
  { key: "campaign", label: "Campaign" },
];

export function LeadSourcePerformanceCard({
  sourceRows,
  campaignRows,
}: LeadSourcePerformanceCardProps) {
  const [group, setGroup] = useState<GroupKey>("source");

  const rows = group === "source" ? sourceRows : campaignRows;
  const labelHeader = group === "source" ? "Source" : "Campaign";
  const emptyMessage =
    group === "source"
      ? "Belum ada lead dengan source."
      : "Belum ada lead yang ter-attribute ke campaign.";

  return (
    <div className="rounded-xl border p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Lead Source Performance</h2>
          <p className="text-sm text-muted-foreground">
            Leads, bookings, dan conversion rate per {labelHeader.toLowerCase()}.
          </p>
        </div>

        <div className="inline-flex rounded-lg border p-1">
          {GROUPS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setGroup(item.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                group === item.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent/50",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-start">
        <PerformanceTable
          rows={rows}
          labelHeader={labelHeader}
          emptyMessage={emptyMessage}
        />
        {rows.length > 0 ? <ConversionBarChart rows={rows} /> : null}
      </div>
    </div>
  );
}
