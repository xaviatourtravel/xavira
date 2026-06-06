type LeadPriority = {
  id: string;
  full_name: string;
  status: string;
  package_interest: string | null;
  daysSinceUpdate: number;
  score: number;
};

type Props = {
  leads: LeadPriority[];
};

function formatStatus(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function AiSalesCopilotCard({ leads }: Props) {
  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-lg font-semibold">AI Sales Copilot</h2>

      <p className="mb-4 text-sm text-muted-foreground">
        Lead yang paling layak diprioritaskan hari ini.
      </p>

      {leads.length ? (
        <div className="space-y-2">
          {leads.map((lead, index) => (
            <div key={lead.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate font-medium">
                  #{index + 1} {lead.full_name}
                </p>
                <span className="shrink-0 rounded-md border px-2 py-0.5 text-sm font-bold">
                  {lead.score}
                </span>
              </div>

              <p className="mt-1 truncate text-xs text-muted-foreground">
                {formatStatus(lead.status)} · {lead.package_interest ?? "-"} ·{" "}
                {lead.daysSinceUpdate} hari lalu
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Belum ada lead.</p>
      )}
    </div>
  );
}
