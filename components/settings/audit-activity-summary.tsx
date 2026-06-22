import type { AuditActivitySummary } from "@/lib/audit";

type AuditActivitySummaryProps = {
  summary: AuditActivitySummary;
};

const SUMMARY_ITEMS = [
  { key: "repliesSent", label: "Replies Sent" },
  { key: "leadsConverted", label: "Leads Converted" },
  { key: "followUpsCreated", label: "Follow Ups Created" },
  { key: "bookingsCreated", label: "Bookings Created" },
  { key: "paymentsAdded", label: "Payments Added" },
] as const;

export function AuditActivitySummaryCard({
  summary,
}: AuditActivitySummaryProps) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold">Today&apos;s Activity</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Operational counts for today in Asia/Jakarta time.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {SUMMARY_ITEMS.map((item) => (
          <div
            key={item.key}
            className="rounded-xl border bg-muted/20 px-4 py-3"
          >
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold">{summary[item.key]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
