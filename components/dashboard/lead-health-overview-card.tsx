import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { LeadHealthOverviewCounts } from "@/lib/leads/health-score";
import { cn } from "@/lib/utils";

type LeadHealthOverviewCardProps = {
  counts: LeadHealthOverviewCounts;
};

const METRIC_ITEMS = [
  {
    key: "excellent",
    label: "Excellent Leads",
    href: "/leads?health=excellent",
    valueClassName: "text-emerald-600",
  },
  {
    key: "healthy",
    label: "Healthy Leads",
    href: "/leads?health=healthy",
    valueClassName: "text-blue-600",
  },
  {
    key: "attention",
    label: "Attention Needed",
    href: "/leads?health=attention",
    valueClassName: "text-amber-600",
  },
  {
    key: "critical",
    label: "Critical Leads",
    href: "/leads?health=critical",
    valueClassName: "text-red-600",
  },
] as const;

export function LeadHealthOverviewCard({ counts }: LeadHealthOverviewCardProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold">Lead Health Overview</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Distribusi kesehatan lead aktif berdasarkan skor rule-based.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRIC_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="rounded-xl border p-4 transition-colors hover:bg-accent/50"
          >
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <h3
              className={`mt-2 text-2xl font-bold ${item.valueClassName}`.trim()}
            >
              {counts[item.key]}
            </h3>
          </Link>
        ))}
      </div>

      <div className="mt-4">
        <Link
          href="/leads/critical"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          View Critical Leads
        </Link>
      </div>
    </div>
  );
}
