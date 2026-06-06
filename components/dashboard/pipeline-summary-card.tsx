import Link from "next/link";

import { cn } from "@/lib/utils";

export type PipelineFunnel = {
  new: number;
  contacted: number;
  qualified: number;
  proposal_sent: number;
  negotiating: number;
  won: number;
  lost: number;
};

type PipelineSummaryCardProps = {
  funnel: PipelineFunnel;
};

const PIPELINE_STATUS_ITEMS: Array<{
  key: keyof PipelineFunnel;
  label: string;
  valueClassName?: string;
}> = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "proposal_sent", label: "Proposal" },
  { key: "negotiating", label: "Negotiating" },
  { key: "won", label: "Won", valueClassName: "text-green-600" },
  { key: "lost", label: "Lost", valueClassName: "text-red-600" },
];

const clickableCardClassName =
  "block rounded-lg border p-3 transition-colors hover:bg-accent/50";

export function PipelineSummaryCard({ funnel }: PipelineSummaryCardProps) {
  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-lg font-semibold">Pipeline Summary</h2>

      <p className="mb-4 text-sm text-muted-foreground">
        Distribusi lead berdasarkan status pipeline.
      </p>

      <div className="grid gap-3 md:grid-cols-4">
        {PIPELINE_STATUS_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={`/leads/kanban?status=${item.key}`}
            className={clickableCardClassName}
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
