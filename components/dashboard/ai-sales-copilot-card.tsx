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
  
  export function AiSalesCopilotCard({
    leads,
  }: Props) {
    return (
      <div className="rounded-xl border p-6">
        <h2 className="text-lg font-semibold">
          AI Sales Copilot
        </h2>
  
        <p className="mb-4 text-sm text-muted-foreground">
          Lead yang paling layak diprioritaskan hari ini.
        </p>
  
        {leads.length ? (
          <div className="space-y-3">
            {leads.map((lead, index) => (
              <div
                key={lead.id}
                className="rounded-lg border p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      #{index + 1} {lead.full_name}
                    </p>
  
                    <p className="text-sm text-muted-foreground">
                      Status: {lead.status}
                    </p>
  
                    <p className="text-sm text-muted-foreground">
                      Paket: {lead.package_interest ?? "-"}
                    </p>
  
                    <p className="text-xs text-muted-foreground">
                      {lead.daysSinceUpdate} hari sejak update terakhir
                    </p>
                  </div>
  
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {lead.score}
                    </p>
  
                    <p className="text-xs text-muted-foreground">
                      Priority Score
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Belum ada lead.
          </p>
        )}
      </div>
    );
  }