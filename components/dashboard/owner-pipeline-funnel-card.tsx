import Link from "next/link";

import { cn } from "@/lib/utils";
import type { OwnerPipelineFunnel } from "@/lib/dashboard/owner-dashboard-data";

type OwnerPipelineFunnelCardProps = {
  funnel: OwnerPipelineFunnel;
};

const FUNNEL_ITEMS: Array<{
  key: keyof OwnerPipelineFunnel;
  label: string;
  statusFilter: string;
  valueClassName?: string;
}> = [
  { key: "new", label: "New", statusFilter: "new" },
  { key: "contacted", label: "Contacted", statusFilter: "contacted" },
  { key: "qualified", label: "Qualified", statusFilter: "qualified" },
  {
    key: "negotiating",
    label: "Negotiating",
    statusFilter: "negotiating",
  },
  {
    key: "won",
    label: "Won",
    statusFilter: "won",
    valueClassName: "text-green-600",
  },
];

export function OwnerPipelineFunnelCard({ funnel }: OwnerPipelineFunnelCardProps) {
  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-lg font-semibold">Pipeline Funnel</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Distribusi lead aktif di setiap tahap penjualan.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {FUNNEL_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={`/leads/kanban?status=${item.statusFilter}`}
            className="block rounded-lg border p-3 transition-colors hover:bg-accent/50"
          >
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className={cn("text-2xl font-bold", item.valueClassName)}>
              {funnel[item.key]}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
