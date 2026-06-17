import { cn } from "@/lib/utils";
import type { RevenueFunnel } from "@/lib/dashboard/revenue-intelligence";

type RevenueFunnelCardProps = {
  funnel: RevenueFunnel;
};

const STAGES: Array<{
  key: keyof RevenueFunnel;
  label: string;
  description: string;
  valueClassName?: string;
}> = [
  { key: "totalLeads", label: "Total Leads", description: "Semua lead aktif" },
  { key: "qualified", label: "Qualified", description: "Qualified ke atas" },
  { key: "warmOrHot", label: "Warm / Hot", description: "Temperatur warm/hot" },
  { key: "booking", label: "Booking", description: "Lead dengan booking" },
  {
    key: "paid",
    label: "Paid",
    description: "Booking lunas",
    valueClassName: "text-green-700",
  },
];

export function RevenueFunnelCard({ funnel }: RevenueFunnelCardProps) {
  const total = funnel.totalLeads > 0 ? funnel.totalLeads : 1;

  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-lg font-semibold">Lead Funnel</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Perjalanan lead dari awal masuk sampai pembayaran lunas.
      </p>

      <div className="space-y-3">
        {STAGES.map((stage) => {
          const value = funnel[stage.key];
          const percent = Math.round((value / total) * 100);

          return (
            <div key={stage.key}>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{stage.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {stage.description}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      "text-xl font-bold tabular-nums",
                      stage.valueClassName,
                    )}
                  >
                    {value}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {percent}%
                  </span>
                </div>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    stage.key === "paid" ? "bg-green-600" : "bg-primary",
                  )}
                  style={{ width: `${Math.min(100, percent)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
